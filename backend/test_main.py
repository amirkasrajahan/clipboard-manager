import os
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'



import pytest
import main
@pytest.fixture
def client():
    with main.app.app_context():
        main.db.create_all()
        yield main.app.test_client()
        main.db.drop_all()

def test_get_history_empty(client):
    # no arrange needed — the fixture already gives us fresh, empty tables
    response = client.get('/history')
    assert response.status_code == 200
    assert response.get_json() == []

def test_get_history_full(client):
    
    response = client.get('/history')
    assert response.status_code == 200

def test_post_creates_item(client):
    response = client.post('/history', json={'text': 'hello'})
    assert response.status_code == 201
    body = response.get_json()
    assert body['text'] == 'hello'
    assert body['favorite'] is False
    assert body['note'] == ''


def test_post_rejects_empty_text(client):
    response = client.post('/history', json={'text': '   '})
    assert response.status_code == 400
    assert response.get_json() == {'error': 'text is required'}


def test_post_duplicate_bumps_instead_of_inserting(client):
    # arrange: build up real history through the API, same as a real caller would
    first = client.post('/history', json={'text': 'A'}).get_json()
    client.post('/history', json={'text': 'B'})

    # act: copy A again
    response = client.post('/history', json={'text': 'A'})

    # assert: same row bumped (200, same id), not a new one (which would be 201)
    assert response.status_code == 200
    assert response.get_json()['id'] == first['id']

    # and history still only has 2 items, not 3
    history = client.get('/history').get_json()
    assert len(history) == 2

    # A→B→A should reorder to [A, B] — the re-copied item moves back to
    # index 0, not just avoid a duplicate row. Compare only 'text', not the
    # whole dict, since 'timestamp' is expected to differ after the bump.
    history = client.get('/history').get_json()
    assert history[0]['text'] == first['text']


def test_patch_note_does_not_wipe_favorite(client):
    item = client.post('/history', json={'text': 'hello'}).get_json()
    client.patch(f'/history/{item["id"]}', json={'favorite': True})

    # act: patch only the note — favorite should survive untouched
    response = client.patch(f'/history/{item["id"]}', json={'note': 'a note'})

    assert response.status_code == 200
    body = response.get_json()
    assert body['note'] == 'a note'
    assert body['favorite'] is True


def test_delete_removes_item(client):
    item = client.post('/history', json={'text': 'hello'}).get_json()

    response = client.delete(f'/history/{item["id"]}')
    assert response.status_code == 200
    assert response.get_json() == {'deleted': item['id']}

    history = client.get('/history').get_json()
    assert history == []


def test_delete_missing_item_returns_json_404(client):
    response = client.delete('/history/9999')
    assert response.status_code == 404
    assert response.get_json() == {'error': 'not found'}
