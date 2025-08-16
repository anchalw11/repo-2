from journal import create_app, db

def setup_database():
    """Create database tables."""
    app = create_app()
    with app.app_context():
        db.create_all()
    print("Database tables created.")

if __name__ == '__main__':
    setup_database()
