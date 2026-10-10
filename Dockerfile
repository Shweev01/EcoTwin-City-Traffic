FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv python3-pip sumo sumo-tools ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV SUMO_HOME=/usr/share/sumo \
    SUMO_BINARY=/usr/bin/sumo \
    PYTHONPATH=/usr/share/sumo/tools:/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ECOTWIN_READ_ONLY=true \
    ECOTWIN_REALTIME_DELAY=0.25 \
    PORT=3000

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"
WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend
COPY rl_agent/__init__.py /app/rl_agent/__init__.py
COPY rl_agent/environment.py /app/rl_agent/environment.py
COPY rl_agent/reward.py /app/rl_agent/reward.py
COPY rl_agent/numpy_policy.py /app/rl_agent/numpy_policy.py
COPY rl_agent/models/ppo_ecotwin_actor.npz /app/rl_agent/models/ppo_ecotwin_actor.npz
COPY simulation /app/simulation

EXPOSE 3000
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-3000}"]
