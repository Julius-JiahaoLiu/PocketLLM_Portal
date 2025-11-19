from fastapi import FastAPI
from . import routes

app = FastAPI(title="PocketLLM Portal API")

app.include_router(routes.router)
