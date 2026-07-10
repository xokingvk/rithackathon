# 🔋 Battery Health Analytics using NASA Battery Dataset

An AI-powered Battery Health Analytics system that predicts **State of Health (SoH)**, **Remaining Useful Life (RUL)**, and detects **battery anomalies** using Machine Learning models trained on the **NASA Li-ion Battery Aging Dataset**.

---

# 📌 Project Overview

Lithium-ion batteries degrade over time due to repeated charging and discharging cycles. Monitoring battery health is essential for:

- Electric Vehicles (EVs)
- Energy Storage Systems
- Consumer Electronics
- Industrial Battery Packs

This project uses machine learning to estimate battery health from operational parameters instead of relying solely on traditional Battery Management Systems (BMS).

---

# Features

- 🔋 State of Health (SoH) Prediction
- ⏳ Remaining Useful Life (RUL) Prediction
- 🚨 Battery Anomaly Detection
- 📊 Battery Health Dashboard (Streamlit)
- 📈 Voltage Curve Visualization
- 📋 Battery Fleet Comparison
- 📝 Health Report Logging
- 🧠 Machine Learning-based Predictions

---

# Dataset

Dataset Used:

**NASA Li-ion Battery Aging Dataset**

The dataset contains charging and discharging cycle measurements collected from lithium-ion batteries aged under controlled laboratory conditions.

Dataset includes:

- Charge cycles
- Discharge cycles
- Voltage measurements
- Current measurements
- Temperature measurements
- Capacity degradation

Repository Structure:

```
Nasa_Battery_cleaned_dataset/
│
├── metadata.csv
├── processed_charge_data.csv
├── processed_battery_data.csv
├── data/
│     000001.csv
│     000002.csv
│     ...
```

---

# Data Processing Pipeline

## 1. Load Metadata

Metadata is used to identify:

- Battery ID
- Cycle Type
- Source CSV
- Start Time
- Ambient Temperature

---

## 2. Extract Discharge Features

For every discharge cycle:

- Maximum Voltage
- Minimum Voltage
- Average Current
- Average Temperature
- Capacity
- Cycle Duration

---

## 3. Extract Charge Features

For every charge cycle:

- Charge Duration
- Maximum Charging Temperature

---

## 4. Merge Charge & Discharge Data

Charge and discharge records are merged using:

- Battery ID
- Source File

---

## 5. Data Cleaning

Invalid records are removed:

- Missing Capacity
- Capacity ≤ 0
- Infinite values
- Missing numerical values

---

## 6. Cycle Number Generation

Cycle number is generated independently for every battery.

Example:

Battery B0005

Cycle 1

Cycle 2

Cycle 3

...

Cycle 168

---

## 7. Initial Capacity

Initial battery capacity is computed using the maximum valid capacity recorded for each battery.

```
Initial Capacity = Maximum Capacity of Battery
```

---

## 8. State of Health (SoH)

State of Health is calculated as:

```
SoH = (Current Capacity / Initial Capacity) × 100
```

Values are clipped between

```
0% and 100%
```

to avoid physically impossible battery health values.

---

## 9. Remaining Useful Life (RUL)

Remaining Useful Life is calculated as:

```
Maximum Cycle Number − Current Cycle Number
```

Example

Cycle 1

RUL = 167

Cycle 50

RUL = 118

Final Cycle

RUL = 0

---

## 10. Feature Engineering

Additional engineered features:

### Voltage Range

```
Voltage Range = Max Voltage − Min Voltage
```

### Capacity Fade Rate

Percentage change in battery capacity between consecutive cycles.

---

# Features Used for Training

```
max_voltage
min_voltage
avg_current
avg_temp
cycle_duration
voltage_range
capacity_fade_rate
charge_duration
max_temp_charge
cycle_number
```

---

# Machine Learning Models

## 1. State of Health Prediction

Model:

```
XGBoost Regressor
```

Target

```
SoH
```

Performance

| Metric | Value |
|---------|------:|
| MAE | **1.614** |
| RMSE | **2.953** |
| R² | **0.9491** |

---

## 2. Remaining Useful Life Prediction

Model

```
XGBoost Regressor
```

Target

```
RUL
```

Performance

| Metric | Value |
|---------|------:|
| MAE | **4.298** |
| RMSE | **9.617** |
| R² | **0.9615** |

---

## 3. Battery Anomaly Detection

Model

```
Isolation Forest
```

Features Used

```
max_voltage
min_voltage
avg_current
avg_temp
cycle_duration
```

Output

```
1  = Normal

-1 = Anomaly
```

---

# Saved Models

```
soh_model.pkl

rul_model.pkl

anomaly_model.pkl
```

These models are directly loaded into the Streamlit application.

---

# Streamlit Dashboard

The dashboard provides:

- State of Health Prediction
- Remaining Useful Life Prediction
- Manual Battery Input
- Dataset-based Prediction
- Battery Health Status
- Battery Grade
- Anomaly Detection
- Voltage Curve Viewer
- Fleet Comparison
- Health Report Logs

---

# Technologies Used

Python

Pandas

NumPy

Scikit-Learn

XGBoost

Isolation Forest

Joblib

Matplotlib

Streamlit

Google Colab

---

# Project Workflow

```
NASA Dataset
      │
      ▼
Data Cleaning
      │
      ▼
Feature Engineering
      │
      ▼
Generate SoH
      │
      ▼
Generate RUL
      │
      ▼
Train XGBoost Models
      │
      ▼
Train Isolation Forest
      │
      ▼
Save Models
      │
      ▼
Streamlit Dashboard
      │
      ▼
Battery Health Prediction
```

---

# Repository Structure

```
Battery-Health-Analytics/

│

├── app.py

├── README.md

├── requirements.txt

├── soh_model.pkl

├── rul_model.pkl

├── anomaly_model.pkl

├── processed_battery_data.csv

├── processed_charge_data.csv

├── metadata.csv

├── data/

├── notebooks/

└── images/
```

---

# Future Improvements

- Deep Learning based SoH Prediction
- LSTM-based RUL Estimation
- Real-time BMS Integration
- IoT Battery Monitoring
- Cloud Deployment
- Explainable AI (SHAP)
- Multi-Battery Fleet Analytics

---

# Acknowledgements

NASA Ames Prognostics Center of Excellence for providing the Lithium-ion Battery Aging Dataset.

---

# License

This project is developed for educational and research purposes.
