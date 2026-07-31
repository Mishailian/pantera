from __init__ import create_app
from commands.seed import seed_roles


def main() -> None:
    app = create_app()

    with app.app_context():
        seed_roles()

    print("Roles synchronized.")


if __name__ == "__main__":
    main()
