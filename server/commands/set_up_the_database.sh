sudo docker compose exec backend python -m flask --app manage:app db upgrade
sudo docker compose exec backend python seed_roles.py
