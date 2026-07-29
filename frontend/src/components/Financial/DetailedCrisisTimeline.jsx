import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

const DetailedCrisisTimeline = ({ activeTab }) => {
  // Using the same crisis data from LeadershipCrises
  const [crisisData, setCrisisData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  useEffect(() => {
    // Extract all crises from the data in LeadershipCrises component
    const extractedCrises = [];
    
    // 18th Century
    [
      { year: 1720, name: "South Sea Bubble & Mississippi Bubble", governance: "Constitutional Monarchy", century: "18th" },
      { year: 1720, name: "South Sea Bubble & Mississippi Bubble", governance: "Absolute Monarchy (Regency)", century: "18th" },
      { year: 1763, name: "Amsterdam Banking Crisis", governance: "Republic with Stadtholder", century: "18th" },
      { year: 1772, name: "British Credit Crisis", governance: "Constitutional Monarchy", century: "18th" },
      { year: 1783, name: "French Financial Crisis", governance: "Absolute Monarchy", century: "18th" },
      { year: 1792, name: "Panic of 1792", governance: "Federal Republic", century: "18th" },
      { year: 1796, name: "Land Speculation Crisis", governance: "Constitutional Monarchy", century: "18th" },
      { year: 1796, name: "Land Speculation Crisis", governance: "Federal Republic", century: "18th" }
    ].forEach(crisis => extractedCrises.push(crisis));
    
    // 19th Century
    [
      { year: 1819, name: "Panic of 1819", governance: "Federal Republic", century: "19th" },
      { year: 1837, name: "Panic of 1837", governance: "Federal Republic", century: "19th" },
      { year: 1857, name: "Panic of 1857", governance: "Federal Republic", century: "19th" },
      { year: 1866, name: "Panic of 1866", governance: "Constitutional Monarchy", century: "19th" },
      { year: 1873, name: "Panic of 1873", governance: "Federal Republic", century: "19th" },
      { year: 1884, name: "Panic of 1884", governance: "Federal Republic", century: "19th" },
      { year: 1890, name: "Baring Crisis", governance: "Constitutional Monarchy", century: "19th" },
      { year: 1893, name: "Panic of 1893", governance: "Federal Republic", century: "19th" }
    ].forEach(crisis => extractedCrises.push(crisis));
    
    // 20th Century
    [
      { year: 1907, name: "Panic of 1907", governance: "Federal Republic", century: "20th" },
      { year: 1929, name: "Great Depression", governance: "Federal Republic", century: "20th" },
      { year: 1929, name: "Great Depression", governance: "Constitutional Monarchy", century: "20th" },
      { year: 1973, name: "Oil Crisis", governance: "Federal Republic", century: "20th" },
      { year: 1973, name: "Oil Crisis", governance: "Constitutional Monarchy", century: "20th" },
      { year: 1987, name: "Black Monday", governance: "Federal Republic", century: "20th" },
      { year: 1987, name: "Black Monday", governance: "Constitutional Monarchy", century: "20th" }
    ].forEach(crisis => extractedCrises.push(crisis));
    
    // 21st Century
    [
      { year: 2008, name: "Global Financial Crisis", governance: "Federal Republic", century: "21st" },
      { year: 2008, name: "Global Financial Crisis", governance: "Constitutional Monarchy", century: "21st" },
      { year: 2010, name: "Eurozone Debt Crisis", governance: "Parliamentary Republic", century: "21st" },
      { year: 2010, name: "Eurozone Debt Crisis", governance: "Federal Republic", century: "21st" },
      { year: 2020, name: "COVID-19 Pandemic Economic Crisis", governance: "Federal Republic", century: "21st" },
      { year: 2020, name: "COVID-19 Pandemic Economic Crisis", governance: "Constitutional Monarchy", century: "21st" },
      { year: 2023, name: "Silicon Valley Bank Collapse", governance: "Federal Republic", century: "21st" }
    ].forEach(crisis => extractedCrises.push(crisis));
    
    // Process the governance types to match y-axis values
    const processedData = extractedCrises.map(crisis => {
      let yValue = 0;
      if (crisis.governance.includes("Parliamentary Republic")) yValue = 5;
      else if (crisis.governance.includes("Federal Republic")) yValue = 4;
      else if (crisis.governance.includes("Republic with Stadtholder")) yValue = 3;
      else if (crisis.governance.includes("Absolute Monarchy")) yValue = 2;
      else if (crisis.governance.includes("Constitutional Monarchy")) yValue = 1;
      
      return {
        ...crisis,
        x: crisis.year,
        y: yValue,
        z: 10 // Size of dot
      };
    });
    
    setCrisisData(processedData);
  }, []);

  // Filter data based on activeTab
  useEffect(() => {
    if (crisisData.length > 0) {
      if (activeTab === "all") {
        setFilteredData(crisisData);
      } else if (activeTab) {
        setFilteredData(crisisData.filter(crisis => crisis.century === activeTab));
      } else {
        setFilteredData(crisisData);
      }
    }
  }, [crisisData, activeTab]);

  // Get color for governance
  const getGovernanceColor = (governance) => {
    if (governance.includes("Constitutional")) return "#1677FF"; // Blue
    if (governance.includes("Federal")) return "#36CFC9"; // Teal
    if (governance.includes("Absolute")) return "#FF4D4F"; // Red
    if (governance.includes("Parliamentary")) return "#52C41A"; // Green
    return "#722ED1"; // Purple for others
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
          <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Year:</span> {data.year}</p>
          <p style={{ margin: 0 }}><span style={{ fontWeight: 'bold' }}>Governance:</span> {data.governance}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'sans-serif', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Detailed Crisis Timeline</h2>
      <div style={{ height: '500px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 30, left: 180 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Year"
              domain={activeTab === "all" ? [1700, 2030] :
                     activeTab === "18th" ? [1700, 1800] : 
                     activeTab === "19th" ? [1800, 1900] : 
                     activeTab === "20th" ? [1900, 2000] : 
                     [2000, 2030]}
              tickCount={7}
              label={{ value: 'Year', position: 'bottom', offset: 0 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Governance"
              tick={(props) => {
                const { x, y, payload } = props;
                const governanceLabels = [
                  "",
                  "Constitutional Monarchy",
                  "Absolute Monarchy",
                  "Republic with Stadtholder",
                  "Federal Republic",
                  "Parliamentary Republic"
                ];
                if (payload.value >= 1 && payload.value <= 5) {
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      dy={4} 
                      textAnchor="end" 
                      fill="#666"
                      fontSize={12}
                    >
                      {governanceLabels[payload.value]}
                    </text>
                  );
                }
                return null;
              }}
              axisLine={{ strokeWidth: 1 }}
              tickLine={false}
              ticks={[1, 2, 3, 4, 5]}
              domain={[0, 6]}
            />
            <ZAxis type="number" dataKey="z" range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              name="Financial Crises" 
              data={filteredData} 
              fill="#8884d8"
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getGovernanceColor(entry.governance)} 
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#1677FF', borderRadius: '50%', marginRight: '8px' }}></div>
            <span>Constitutional Monarchy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#FF4D4F', borderRadius: '50%', marginRight: '8px' }}></div>
            <span>Absolute Monarchy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#722ED1', borderRadius: '50%', marginRight: '8px' }}></div>
            <span>Republic with Stadtholder</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#36CFC9', borderRadius: '50%', marginRight: '8px' }}></div>
            <span>Federal Republic</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#52C41A', borderRadius: '50%', marginRight: '8px' }}></div>
            <span>Parliamentary Republic</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '16px', fontSize: '13px', color: '#999', fontStyle: 'italic', textAlign: 'center' }}>
        Click on points to view more details about each financial crisis event
      </div>
    </div>
  );
};

export default DetailedCrisisTimeline; 