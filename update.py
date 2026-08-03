import re

with open('src/pages/Routines.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Delete Metrics Line Chart
# Find {/* Metrics Line Chart */} to the closing div before {isReordering ? (
pattern1 = r'\{\/\* Metrics Line Chart \*\/.*?</div>\s*</div>\s*(?=\{\s*isReordering\s*\?\s*\()'
content = re.sub(pattern1, '', content, flags=re.DOTALL)

# 2. Modify layout wrappers
pattern2 = r'\)\s*:\s*\(\s*<div style=\{\{\s*display:\s*\'flex\',\s*flexDirection:\s*\'column\',\s*gap:\s*\'2rem\'\s*\}\}>'
replacement2 = r') : (\n          <div style={{ display: \'flex\', gap: \'2rem\', alignItems: \'flex-start\', flexWrap: \'wrap\' }}>\n            {/* Left Pane (70%) */}\n            <div style={{ flex: \'7 1 600px\', minWidth: 0, display: \'flex\', flexDirection: \'column\', gap: \'2rem\' }}>'
content = re.sub(pattern2, replacement2, content)

# 3. Add Right Pane before the closing )}
pattern3 = r'</div>\s*</div>\s*</div>\s*\)\}'
replacement3 = r'''</div>
          </div>
          
          {/* Right Pane (30%) */}
          <div style={{ flex: '3 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-color)', margin: 0, fontWeight: 'bold' }}>Metrics</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.6rem', padding: '0.25rem 0.6rem', borderRadius: '16px', background: 'var(--text-color)', color: 'var(--bg-color)' }}>Sleep</span>
                  <span style={{ fontSize: '0.6rem', padding: '0.25rem 0.6rem', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>Water</span>
                  <span style={{ fontSize: '0.6rem', padding: '0.25rem 0.6rem', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>Deep Work</span>
                  <span style={{ fontSize: '0.6rem', padding: '0.25rem 0.6rem', borderRadius: '16px', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>Steps</span>
                </div>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {metrics.map(m => {
                   const metricData = chartData.map(d => ({
                      displayDay: d.displayDay,
                      value: d.metrics && d.metrics[m.id] !== undefined ? d.metrics[m.id] : null
                   }));
                   
                   const validData = metricData.filter(d => d.value !== null);
                   let lastValue = 0;
                   let prevValue = 0;
                   let trendText = "No data";
                   let trendColor = "var(--dim-text)";
                   let trendIcon = "";
                   
                   if (validData.length > 0) {
                      lastValue = validData[validData.length - 1].value;
                      if (validData.length > 1) {
                         prevValue = validData[validData.length - 2].value;
                         const diff = lastValue - prevValue;
                         if (diff > 0) {
                            trendText = ${diff.toFixed(1)} from yesterday;
                            trendIcon = "↑";
                            trendColor = "var(--accent-green)";
                         } else if (diff < 0) {
                            trendText = ${Math.abs(diff).toFixed(1)} from yesterday;
                            trendIcon = "↓";
                            trendColor = "#FF5252";
                         } else {
                            trendText = "Same as yesterday";
                         }
                      } else {
                         trendText = "First entry";
                      }
                   }
                   
                   return (
                     <div key={m.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: 'transparent' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--cell-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.25rem' }}>
                         {m.label === 'Sleep' ? '☾' : m.label === 'Water' ? '💧' : m.label === 'Deep Work' ? '🎯' : m.label === 'Steps' ? '👟' : '✧'}
                       </div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{m.label}</div>
                         <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', margin: '0.25rem 0' }}>{lastValue} <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-sans)', color: 'var(--dim-text)' }}>{m.unit}</span></div>
                         <div style={{ fontSize: '0.7rem', color: trendColor }}>
                           {trendIcon && <span style={{ marginRight: '0.2rem' }}>{trendIcon}</span>}
                           {trendText}
                         </div>
                       </div>
                       <div style={{ width: '100px', height: '50px', flexShrink: 0 }}>
                         <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={metricData}>
                             <Line type="monotone" dataKey="value" stroke="var(--text-color)" strokeWidth={2} dot={{ r: 3, fill: 'var(--text-color)', strokeWidth: 0 }} connectNulls={true} />
                           </LineChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                   );
                })}
             </div>
             
             <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--dim-text)', cursor: 'pointer' }}>View all metrics</span>
               <span style={{ fontSize: '1.2rem', color: 'var(--dim-text)' }}>›</span>
             </div>
          </div>
        </div>
        }
'''

content = re.sub(pattern3, replacement3, content)

with open('src/pages/Routines.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
