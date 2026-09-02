# ============================================================
# DecisionAI By Essalhi — ML Models (Sans XGBoost)
# ============================================================

import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

class RevenuePredictor:
    """Prédiction du CA avec RandomForest (remplace XGBoost)"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = 'models/revenue_model.pkl'
        self.load_model()
    
    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            print("✅ Modèle Revenue chargé")
        else:
            # Utiliser RandomForest au lieu de XGBoost
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            print("🆕 Nouveau modèle Revenue créé (RandomForest)")
    
    def save_model(self):
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print("✅ Modèle Revenue sauvegardé")
    
    def prepare_features(self, transactions):
        """Préparer les features à partir des transactions réelles"""
        if not transactions or len(transactions) == 0:
            return None
        
        df = pd.DataFrame(transactions)
        df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Grouper par mois
        features = df.groupby(pd.Grouper(key='created_at', freq='M')).agg({
            'amount': ['sum', 'mean', 'count', 'std']
        }).fillna(0)
        
        features.columns = ['total', 'avg', 'count', 'std']
        
        # Features de tendance
        features['lag_1'] = features['total'].shift(1).fillna(0)
        features['lag_2'] = features['total'].shift(2).fillna(0)
        features['lag_3'] = features['total'].shift(3).fillna(0)
        features['rolling_3'] = features['total'].rolling(3).mean().fillna(0)
        features['rolling_6'] = features['total'].rolling(6).mean().fillna(0)
        features['growth'] = features['total'].pct_change().fillna(0)
        
        return features
    
    def train(self, transactions):
        """Entraîner le modèle sur les données réelles"""
        features = self.prepare_features(transactions)
        if features is None or len(features) < 6:
            return {'status': 'error', 'message': 'Pas assez de données réelles (minimum 6 mois)'}
        
        X = features[:-1]
        y = features['total'][1:].values
        
        if len(X) < 3:
            return {'status': 'error', 'message': 'Pas assez de données'}
        
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.save_model()
        
        return {
            'status': 'success',
            'message': f'Modèle entraîné sur {len(X)} mois de données réelles',
            'samples': len(X)
        }
    
    def predict(self, transactions):
        """Prédire à partir des données réelles"""
        features = self.prepare_features(transactions)
        if features is None or len(features) < 3:
            return self._fallback_prediction(transactions)
        
        X = features.iloc[-1:].values
        X_scaled = self.scaler.transform(X)
        
        prediction = self.model.predict(X_scaled)[0]
        trend = self._calculate_trend(features)
        confidence = self._calculate_confidence(features)
        
        return {
            'prediction': float(max(0, prediction)),
            'confidence_interval': {
                'low': float(max(0, prediction * (1 - (1 - confidence/100)))),
                'high': float(prediction * (1 + (1 - confidence/100)))
            },
            'trend': trend,
            'confidence_score': confidence,
            'next_month_forecast': float(max(0, prediction))
        }
    
    def _fallback_prediction(self, transactions):
        if not transactions:
            return {
                'prediction': 0,
                'confidence_interval': {'low': 0, 'high': 0},
                'trend': 'stable',
                'confidence_score': 0,
                'next_month_forecast': 0
            }
        
        df = pd.DataFrame(transactions)
        total = df['amount'].sum()
        avg = total / len(transactions) if len(transactions) > 0 else 0
        
        return {
            'prediction': float(avg * 30),
            'confidence_interval': {'low': float(avg * 20), 'high': float(avg * 40)},
            'trend': 'stable',
            'confidence_score': 30,
            'next_month_forecast': float(avg * 30)
        }
    
    def _calculate_trend(self, features):
        if len(features) < 3:
            return 'stable'
        
        recent = features['total'].tail(3).mean()
        older = features['total'].head(3).mean()
        
        if older == 0:
            return 'stable'
        
        change = ((recent - older) / older) * 100
        
        if change > 5:
            return 'up'
        elif change < -5:
            return 'down'
        else:
            return 'stable'
    
    def _calculate_confidence(self, features):
        if len(features) < 6:
            return 40
        elif len(features) < 12:
            return 60
        elif len(features) < 24:
            return 75
        else:
            return 90


class AnomalyDetector:
    """Détection d'anomalies dans les transactions réelles"""
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.model_path = 'models/anomaly_model.pkl'
        self.load_model()
    
    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            print("✅ Modèle Anomaly chargé")
    
    def save_model(self):
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print("✅ Modèle Anomaly sauvegardé")
    
    def train(self, transactions):
        if not transactions or len(transactions) < 10:
            return {'status': 'error', 'message': 'Pas assez de transactions réelles'}
        
        df = pd.DataFrame(transactions)
        features = self._extract_features(df)
        
        X_scaled = self.scaler.fit_transform(features)
        self.model.fit(X_scaled)
        self.save_model()
        
        return {'status': 'success', 'message': 'Modèle entraîné sur les données réelles'}
    
    def detect(self, transactions):
        if not transactions or len(transactions) < 5:
            return []
        
        df = pd.DataFrame(transactions)
        features = self._extract_features(df)
        
        X_scaled = self.scaler.transform(features)
        predictions = self.model.predict(X_scaled)
        scores = self.model.score_samples(X_scaled)
        
        anomalies = []
        for i, pred in enumerate(predictions):
            if pred == -1:
                row = df.iloc[i]
                anomalies.append({
                    'id': str(row.get('id', i)),
                    'amount': float(row.get('amount', 0)),
                    'type': str(row.get('type', 'unknown')),
                    'date': row.get('created_at', datetime.now().isoformat()),
                    'score': float(scores[i]),
                    'description': f'Transaction de {float(row.get("amount", 0)):,.2f} MAD - Montant inhabituel'
                })
        
        anomalies.sort(key=lambda x: x['score'])
        return anomalies[:10]
    
    def _extract_features(self, df):
        features = pd.DataFrame()
        features['amount'] = df['amount'].fillna(0)
        
        df['date'] = pd.to_datetime(df['created_at'])
        features['day_of_week'] = df['date'].dt.dayofweek
        features['day_of_month'] = df['date'].dt.day
        features['month'] = df['date'].dt.month
        
        features['is_sale'] = (df['type'] == 'sale').astype(int)
        features['is_income'] = (df['type'] == 'income').astype(int)
        features['is_expense'] = (df['type'] == 'expense').astype(int)
        
        features['quantity'] = df.get('quantity', 1).fillna(1)
        
        return features


class PerformanceAnalyzer:
    """Analyse de performance basée sur les données réelles"""
    
    def analyze(self, transactions, budgets, goals):
        """Analyser la performance à partir des données réelles"""
        if not transactions:
            return {
                'score': 0,
                'level': 'insuffisant',
                'margin': 0,
                'profit': 0,
                'recommendations': ['Ajoutez des transactions réelles pour une analyse complète'],
                'details': {}
            }
        
        df = pd.DataFrame(transactions)
        
        total_revenue = df[df['type'].isin(['sale', 'income'])]['amount'].sum()
        total_expenses = df[~df['type'].isin(['sale', 'income'])]['amount'].sum()
        profit = total_revenue - total_expenses
        margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
        
        n_transactions = len(transactions)
        n_customers = len(df['client_name'].unique()) if 'client_name' in df.columns else 0
        
        # Score basé sur les données réelles
        score = 0
        if total_revenue > 0:
            score += min(30, (total_revenue / 10000) * 10)
        if profit > 0:
            score += min(20, profit / 1000)
        if margin > 0:
            score += min(20, margin)
        if n_transactions > 0:
            score += min(15, n_transactions / 5)
        if n_customers > 0:
            score += min(15, n_customers / 2)
        score = min(100, max(0, score))
        
        if score >= 80:
            level = 'excellent'
        elif score >= 60:
            level = 'bon'
        elif score >= 40:
            level = 'moyen'
        else:
            level = 'insuffisant'
        
        recommendations = []
        if margin < 15 and total_revenue > 0:
            recommendations.append(f'📊 Marge de {margin:.1f}% - Optimisez vos coûts')
        if n_customers < 5 and total_revenue > 0:
            recommendations.append('👥 Peu de clients uniques - Diversifiez votre clientèle')
        if total_revenue < 50000 and total_revenue > 0:
            recommendations.append('📈 Augmentez votre chiffre d\'affaires')
        if not recommendations and total_revenue > 0:
            recommendations.append('✅ Excellente performance basée sur vos données réelles !')
        
        return {
            'score': round(score, 1),
            'level': level,
            'margin': round(margin, 1),
            'profit': round(profit, 2),
            'recommendations': recommendations,
            'details': {
                'total_revenue': round(total_revenue, 2),
                'total_expenses': round(total_expenses, 2),
                'n_transactions': n_transactions,
                'n_customers': n_customers
            }
        }