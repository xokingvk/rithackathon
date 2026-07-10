# 🔋 Battery Health Analytics using Machine Learning

An AI-powered Battery Health Analytics web application that predicts **State of Health (SoH)**, **Remaining Useful Life (RUL)**, and detects **battery anomalies** using Machine Learning models trained on the **NASA Lithium-Ion Battery Aging Dataset**.

The project combines a modern web interface with machine learning to help users monitor battery health, estimate battery lifespan, and identify abnormal battery behavior.

---

# 📖 Problem Statement

Lithium-ion batteries are widely used in modern applications such as:

- Electric Vehicles (EVs)
- Energy Storage Systems
- Consumer Electronics
- Robotics
- Industrial Backup Power Systems

As batteries undergo repeated charging and discharging cycles, their performance gradually deteriorates. Battery degradation leads to reduced capacity, shorter operating time, and an increased risk of unexpected failures.

Most Battery Management Systems (BMS) monitor real-time parameters like voltage, current, and temperature, but they often do not provide accurate predictions about battery health or remaining lifetime.

Without reliable battery health estimation:

- Battery failures become unpredictable.
- Maintenance costs increase.
- EV driving range decreases.
- Battery replacement decisions become difficult.
- Safety risks increase due to abnormal battery behavior.

---

# 💡 Solution

This project uses Machine Learning to estimate battery health based on historical battery measurements collected during charging and discharging cycles.

The system predicts:

- 🔋 State of Health (SoH)
- ⏳ Remaining Useful Life (RUL)
- 🚨 Battery Anomaly Detection

The trained models are integrated into a web application that allows users to analyze battery health using either stored battery data or manually entered battery parameters.

---

# 🎯 Objectives

- Predict battery degradation accurately.
- Estimate remaining battery life.
- Detect abnormal battery conditions.
- Assist preventive maintenance.
- Improve battery management decisions.
- Reduce unexpected battery failures.

---

# ✨ Features

- 🔋 State of Health Prediction
- ⏳ Remaining Useful Life Prediction
- 🚨 Battery Anomaly Detection
- 📊 Battery Health Dashboard
- 📈 Voltage Curve Visualization
- 📋 Battery Fleet Comparison
- 📝 Prediction History
- 📥 Manual Battery Parameter Input
- 📂 Dataset-Based Prediction

---

# 🖥️ Website Modules

## Battery Health Prediction

Users can:

- Select battery data from the dataset.
- Enter battery parameters manually.
- Predict battery health.
- Estimate remaining battery life.
- Detect abnormal battery behavior.

---

## Voltage Curve Visualization

Displays discharge voltage curves for battery cycles, allowing users to observe degradation over time.

---

## Fleet Comparison

Compares multiple batteries using:

- State of Health
- Remaining Useful Life
- Cycle Number

This helps identify healthy and degraded batteries.

---

## Prediction History

Stores prediction results including:

- Battery ID
- Cycle Number
- State of Health
- Remaining Useful Life
- Battery Status
- Prediction Timestamp

---

# 📂 Dataset

Dataset Used:

**NASA Lithium-Ion Battery Aging Dataset**

The dataset contains charge and discharge cycle measurements collected under controlled laboratory conditions.

Dataset includes:

- Charge Cycles
- Discharge Cycles
- Voltage Measurements
- Current Measurements
- Temperature Measurements
- Capacity Measurements

---

# 🤖 Machine Learning Models

The system uses three machine learning models.

## 1. State of Health Prediction

Model:

- XGBoost Regressor

Target:

- State of Health (SoH)

Performance:

| Metric | Score |
|---------|------:|
| MAE | **1.614** |
| RMSE | **2.953** |
| R² Score | **0.9491** |

---

## 2. Remaining Useful Life Prediction

Model:

- XGBoost Regressor

Target:

- Remaining Useful Life (RUL)

Performance:

| Metric | Score |
|---------|------:|
| MAE | **4.298** |
| RMSE | **9.617** |
| R² Score | **0.9615** |

---

## 3. Battery Anomaly Detection

Model:

- Isolation Forest

Output:

- Normal
- Anomaly

---

# 📊 Features Used

The models are trained using:

- Maximum Voltage
- Minimum Voltage
- Average Current
- Average Temperature
- Cycle Duration
- Voltage Range
- Capacity Fade Rate
- Charge Duration
- Maximum Charging Temperature
- Cycle Number

---

# ⚙️ System Workflow

```
NASA Battery Dataset
          │
          ▼
Data Cleaning
          │
          ▼
Feature Engineering
          │
          ▼
Generate SoH & RUL
          │
          ▼
Train Machine Learning Models
          │
          ▼
Save Trained Models
          │
          ▼
Backend API
          │
          ▼
Website Interface
          │
          ▼
Battery Health Prediction
```

---

# 💻 Technology Stack

## Frontend

- HTML5
- CSS3
- JavaScript

## Backend

- Python
- Flask

## Machine Learning

- XGBoost
- Scikit-learn
- Isolation Forest

## Data Processing

- Pandas
- NumPy

## Visualization

- Matplotlib

## Model Serialization

- Joblib

## Development Tools

- Google Colab
- Visual Studio Code

## Version Control

- Git
- GitHub

---

# 📁 Project Structure

```
Battery-Health-Analytics/

│
├── frontend/
│   ├── index.html
│   ├── prediction.html
│   ├── comparison.html
│   ├── history.html
│   ├── css/
│   ├── js/
│   └── images/
│
├── backend/
│   ├── app.py
│   ├── routes.py
│   ├── models.py
│   └── utils.py
│
├── models/
│   ├── soh_model.pkl
│   ├── rul_model.pkl
│   └── anomaly_model.pkl
│
├── dataset/
│   ├── processed_battery_data.csv
│   ├── processed_charge_data.csv
│   ├── metadata.csv
│   └── data/
│
├── notebooks/
│   └── Model_Training.ipynb
│
├── README.md
├── requirements.txt
└── LICENSE
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/yourusername/Battery-Health-Analytics.git
```

Move into the project directory

```bash
cd Battery-Health-Analytics
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run the backend server

```bash
python app.py
```

Open your browser

```
http://localhost:5000
```

---

# 🔮 Future Improvements

- Deep Learning-based SoH Prediction
- LSTM-based Remaining Useful Life Prediction
- IoT-Based Battery Monitoring
- Real-Time Battery Management System Integration
- Explainable AI (SHAP)
- Cloud Deployment
- Mobile Application
- Battery Fleet Analytics Dashboard

---

# 🙏 Acknowledgements

- NASA Ames Prognostics Center of Excellence
- Scikit-learn
- XGBoost
- Flask
- Open Source Python Community

---

# 📄 License

This project is developed for educational and research purposes.

---

# 👨‍💻 Authors

**1.Vishnuvardhan B**

**2.Kamaleshwaran B**

**3.John Ezra P**

**4.Kevin cris F**

Battery Health Analytics using Machine Learning
