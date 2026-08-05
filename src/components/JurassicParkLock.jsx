import React, { useEffect, useState } from 'react';

function JurassicParkLock() {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(b => !b);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      color: '#00ff00',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'monospace',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        width: '100%',
        textAlign: 'center',
        backgroundColor: blink ? 'red' : 'transparent',
        color: blink ? 'white' : 'red',
        fontWeight: 'bold',
        fontSize: '2rem',
        padding: '10px 0',
        textTransform: 'uppercase',
        letterSpacing: '5px'
      }}>
        SECURITY BREACH DETECTED
      </div>

      <img 
        src="https://media.tenor.com/D4V9NSq0E08AAAAC/jurassic-park-dennis-nedry.gif" 
        alt="Ah ah ah! You didn't say the magic word!"
        style={{
          maxWidth: '80%',
          maxHeight: '50vh',
          border: '5px solid #00ff00',
          marginBottom: '2rem'
        }}
      />

      <div style={{
        fontSize: '1.5rem',
        textAlign: 'center',
        textShadow: '0 0 10px #00ff00'
      }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            YOU DIDN'T SAY THE MAGIC WORD!
          </div>
        ))}
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '0.8rem',
        color: 'rgba(0, 255, 0, 0.5)'
      }}>
        Access permanently locked. Clear Local Storage to reboot terminal.
      </div>
    </div>
  );
}

export default JurassicParkLock;
