from __init__ import create_app
from flask.cli import FlaskGroup

app = create_app()

cli = FlaskGroup(
    create_app=lambda: app
)

if __name__ == "__main__":
    cli()
