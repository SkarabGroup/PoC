import { useState } from 'react'

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!repoUrl) return alert("Inserisci un URL!");
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoURL: repoUrl,
          userId: "698fcc5a369c527fbf284d0c"
        }),
      });

      if (!response.ok) throw new Error('Errore nella richiesta');

      const data = await response.json();
      alert(`Analisi avviata con successo! ID: ${data.analysisId}`);
      setRepoUrl(''); // Pulisce la barra dopo l'invio
    } catch (error) {
      console.error(error);
      alert("Errore: controlla che il backend sia attivo e i CORS abilitati");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Agenti Analyzer</h1>
      <p>Inserisci l'URL di una repository GitHub per iniziare l'analisi</p>
      
      <div style={{ marginTop: '20px' }}>
        <input 
          type="text" 
          placeholder="https://github.com/utente/repo" 
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          style={{
            padding: '12px',
            width: '400px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            marginRight: '10px'
          }}
        />
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          style={{
            padding: '12px 24px',
            borderRadius: '4px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Inviando...' : 'Analizza'}
        </button>
      </div>
    </div>
  );
}

export default App;
