# ============================================================
# DecisionAI By Essalhi — API Machine Learning
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)

# 🔑 Utiliser les bonnes clés (avec NEXT_PUBLIC_)
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# Afficher pour vérifier
print(f"🔍 SUPABASE_URL: {SUPABASE_URL}")
print(f"🔍 SUPABASE_KEY: {SUPABASE_KEY[:20]}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ ATTENTION: SUPABASE_URL ou SUPABASE_KEY non définis dans .env")
    print("Vérifiez que le fichier .env contient:")
    print("NEXT_PUBLIC_SUPABASE_URL=https://...")
    print("NEXT_PUBLIC_SUPABASE_ANON_KEY=...")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✅ Connexion à Supabase établie")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'supabase': 'connected'
    })

@app.route('/api/ml/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        company_id = data.get('company_id')
        
        if not company_id:
            return jsonify({'error': 'company_id requis'}), 400
        
        # Test de récupération des données
        transactions = supabase.table('transactions')\
            .select('*')\
            .eq('company_id', company_id)\
            .limit(10)\
            .execute()
        
        return jsonify({
            'message': 'API ML fonctionne !',
            'company_id': company_id,
            'transactions_found': len(transactions.data) if transactions.data else 0,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 API ML démarrée sur http://localhost:{port}")
    app.run(debug=True, host='0.0.0.0', port=port)