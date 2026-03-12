from asgiref.wsgi import WsgiToAsgi
from project.urls import app

application = WsgiToAsgi(app)
