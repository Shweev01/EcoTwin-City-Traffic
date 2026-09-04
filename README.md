EcoTwin: Reinforcement Learning for Urban Carbon Dispersal
An AI-driven Digital Twin smart traffic control system designed to dynamically adjust traffic signal phases across an urban grid. Unlike traditional traffic controllers that only minimize vehicle wait times, EcoTwin uses Multi-Objective Reinforcement Learning (RL) to actively "flush" and disperse localized CO2 and smog buildup while maintaining smooth traffic flow.


~Tech Stack
Simulation Engine: SUMO (Simulation of Urban MObility) + Python TraCI

AI / Machine Learning: Python, OpenAI Gym, Ray RLlib / Stable-Baselines3 (PPO Algorithm)

Backend API: FastAPI, Asynchronous WebSockets, Uvicorn

Frontend Dashboard: React.js, Deck.gl / Leaflet, Tailwind CSS

Repository StructurePlaintextEcoTwin/
├── simulation/      # SUMO network configuration, routes (.net.xml, .rou.xml), & TraCI scripts
├── rl_agent/        # Custom OpenAI Gym environment, reward function, & PPO model training
├── backend/         # FastAPI server, WebSocket streaming pipeline, & REST API endpoints
└── frontend/        # React application, Deck.gl live map rendering, & dynamic carbon heatmap UI

~ Key FeaturesMicroscopic Traffic & Emissions Simulation: Models real-time individual vehicle speeds, queues, and localized tailpipe CO2 output.Multi-Objective RL Agent: Trained via Proximal Policy Optimization (PPO) using a balanced reward function (Traffic Delay + CO2 Accumulation).Real-Time Data Streaming: High-frequency WebSocket stream serving live vehicle coordinates, signal phases, and spatial emission levels.Interactive Map Visualization: WebGL-accelerated dashboard displaying moving vehicle entities alongside dynamic CO2 concentration heatmaps.