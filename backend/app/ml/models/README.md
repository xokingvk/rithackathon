# Model directory

Drop your trained model files here with these exact names:

- `soh_model.pkl` — predicts state of health (%) from [voltage, current, temperature, cycle_count, soc]
- `rul_model.pkl` — predicts remaining useful life in cycles from [soh, cycle_count, temperature]
- `charging_model.pkl` — predicts charging efficiency (%) from [voltage, current, temperature, cycle_count]

Any scikit-learn-compatible estimator works (XGBoost, LightGBM, sklearn Pipeline, etc.)
as long as it was saved with `joblib.dump(model, "soh_model.pkl")` and exposes `.predict(X)`.

Until real files are placed here, `app/ml/model_loader.py` automatically falls back
to a documented heuristic so the API keeps returning usable numbers.
