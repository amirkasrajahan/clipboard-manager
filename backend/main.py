from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # allows the React renderer (localhost:3000) to call this API

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
    if not text:
        return jsonify({'error': 'text is required'}), 400

    # skip exact duplicates — don't store the same text twice in a row
    latest = ClipboardItem.query.order_by(ClipboardItem.timestamp.desc()).first()
    if latest and latest.text == text:
        return jsonify(latest.to_dict()), 200

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
    app.run(port=5000, debug=True)
