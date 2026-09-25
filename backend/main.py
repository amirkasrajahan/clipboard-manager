import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # only the React dev server, not any origin

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///clipboard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ---------- Model ----------

class ClipboardItem(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    text      = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    note      = db.Column(db.Text, default='')
    favorite  = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id':        self.id,
            'text':      self.text,
            'timestamp': self.timestamp.isoformat(),
            'note':      self.note,
            'favorite':  self.favorite,
        }


# ---------- Error handlers ----------
# Flask's default 404/400 pages are HTML, which breaks the "always JSON" API
# contract every other route follows. These make db.get_or_404 and malformed
# request bodies come back as JSON too.

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'not found'}), 404


@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': 'bad request'}), 400


# ---------- Routes ----------

@app.route('/history', methods=['GET'])
def get_history():
    """Return all items, newest first."""
    items = ClipboardItem.query.order_by(ClipboardItem.timestamp.desc()).limit(50).all()
    return jsonify([item.to_dict() for item in items])


@app.route('/history', methods=['POST'])
def add_item():
    """Add a new clipboard entry. Body: { text: string }"""
    data = request.get_json()
    text = (data or {}).get('text', '').strip()
    if len(text) > 10000:
        return jsonify({'error': 'text is too long'}), 400
    if not text:
        return jsonify({'error': 'text is required'}), 400

    # if this text exists anywhere in history, bump it to the top instead of
    # inserting a duplicate row (handles copy A, B, A — not just back-to-back A, A)
    existing = ClipboardItem.query.filter_by(text=text).first()
    if existing:
        existing.timestamp = datetime.utcnow()
        db.session.commit()
        return jsonify(existing.to_dict()), 200

    item = ClipboardItem(text=text)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@app.route('/history/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete a clipboard entry by id."""
    item = db.get_or_404(ClipboardItem, item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'deleted': item_id})


@app.route('/history/<int:item_id>', methods=['PATCH'])
def update_item(item_id):
    """Update note and/or favorite for an item. Body: { note?: string, favorite?: bool }"""
    item = db.get_or_404(ClipboardItem, item_id)
    data = request.get_json() or {}

    # PATCH = only touch the fields that were actually sent, unlike PUT which
    # would mean "replace the whole thing". thats why its 2 separate ifs -
    # dont wanna wipe out favorite just bc the frontend only sent a note update
    if 'note' in data:
        item.note = data['note']
    if 'favorite' in data:
        item.favorite = bool(data['favorite'])

    db.session.commit()
    return jsonify(item.to_dict())


# ---------- Entry point ----------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # creates clipboard.db and the table on first run
    app.run(port=5001, debug=os.environ.get('FLASK_DEBUG') == '1')
