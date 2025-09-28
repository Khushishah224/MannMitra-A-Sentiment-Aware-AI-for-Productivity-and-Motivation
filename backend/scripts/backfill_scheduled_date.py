"""Backfill scheduled_date for legacy plan documents.
Usage: run within project venv: python -m backend.scripts.backfill_scheduled_date
Logic: If scheduled_date missing, derive from created_at (date part) else today.
"""
from datetime import datetime, date
from app.utils.database import db

def backfill():
    if not db.is_connected():
        print("Mongo not connected; in-memory mode—nothing to backfill persistently.")
        return
    modified = 0
    cursor = db.plans.find({ 'scheduled_date': { '$exists': False } })
    for doc in cursor:
        created = doc.get('created_at')
        if isinstance(created, datetime):
            sched_date = created.date().isoformat()
        else:
            sched_date = date.today().isoformat()
        db.plans.update_one({'_id': doc['_id']}, { '$set': { 'scheduled_date': sched_date } })
        modified += 1
    print(f"Backfill complete. Updated {modified} documents.")

if __name__ == '__main__':
    backfill()