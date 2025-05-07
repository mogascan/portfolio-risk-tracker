import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import useAppContext from './AppContext';

// Add scrollbar styling
const scrollbarStyles = `
  .hide-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  
  .hide-scrollbar:hover {
    scrollbar-color: rgba(0,0,0,0.2) transparent;
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .hide-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .hide-scrollbar::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 6px;
  }
  
  .hide-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.2);
  }
`;

const CrisesTimeline = ({ governanceFilter = [] }) => {
  // Get events data from context
  const { events } = useAppContext();
  
  // Process data for visualization
  const [chartData, setChartData] = useState([]);
  
  // Get color for governance
  const getGovernanceColor = (governance) => {
    if (governance.includes("Constitutional")) return "#1677FF";
    if (governance.includes("Federal")) return "#36CFC9";
    if (governance.includes("Absolute")) return "#FF4D4F";
    if (governance.includes("Parliamentary")) return "#52C41A";
    if (governance.includes("Republic with")) return "#722ED1";
    return "#722ED1"; // Default color for other governance types
  };
  
  // Determine if we should show all governance types when no filters are selected
  const showAllGovernance = governanceFilter.length === 0;
  
  useEffect(() => {
    // Transform the data for the chart
    if (events && events.length > 0) {
      const timeRange = { start: 1700, end: 2030 };
      const startDecade = Math.floor(timeRange.start / 10) * 10;
      const endDecade = Math.ceil(timeRange.end / 10) * 10;
      
      // Prepare data for timeline chart - crises per decade
      const timelineData = [];
      
      for (let decade = startDecade; decade <= endDecade; decade += 10) {
        const dataPoint = { decade };
        
        // Apply governance filter to crises in this decade if filter is active
        const crisesInDecade = events.filter(c => 
          c.year >= decade && c.year < decade + 10
        );
        
        // Always count total crises regardless of filter
        dataPoint.count = crisesInDecade.length;
        
        // Count by governance type within this decade
        dataPoint.constitutional = crisesInDecade.filter(c => 
          c.governance && c.governance.includes("Constitutional") &&
          (showAllGovernance || governanceFilter.includes("Constitutional Monarchy"))
        ).length;
        
        dataPoint.federal = crisesInDecade.filter(c => 
          c.governance && c.governance.includes("Federal") &&
          (showAllGovernance || governanceFilter.includes("Federal Republic"))
        ).length;
        
        dataPoint.absolute = crisesInDecade.filter(c => 
          c.governance && c.governance.includes("Absolute") &&
          (showAllGovernance || governanceFilter.includes("Absolute Monarchy"))
        ).length;
        
        dataPoint.parliamentary = crisesInDecade.filter(c => 
          c.governance && c.governance.includes("Parliamentary") &&
          (showAllGovernance || governanceFilter.includes("Parliamentary"))
        ).length;
        
        dataPoint.stadtholder = crisesInDecade.filter(c => 
          c.governance && c.governance.includes("Republic with") &&
          (showAllGovernance || governanceFilter.includes("Republic with Stadtholder"))
        ).length;
        
        dataPoint.other = crisesInDecade.filter(c => 
          (!c.governance || 
          (!c.governance.includes("Constitutional") && 
          !c.governance.includes("Federal") && 
          !c.governance.includes("Absolute") && 
          !c.governance.includes("Parliamentary") &&
          !c.governance.includes("Republic with"))) &&
          (showAllGovernance || governanceFilter.includes("Other"))
        ).length;
        
        timelineData.push(dataPoint);
      }
      
      setChartData(timelineData);
    }
  }, [events, governanceFilter, showAllGovernance]);
  
  // Custom tooltip for the timeline chart
  const renderTimelineTooltip = (props) => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <p style={{ fontWeight: 500 }}>{`${label}s`}</p>
          <p style={{ fontSize: '14px' }}>{`Total Crises: ${payload[0].value}`}</p>
          {payload[1] && payload[1].value > 0 && (
            <p style={{ fontSize: '14px' }}>{`Constitutional Monarchy: ${payload[1].value}`}</p>
          )}
          {payload[2] && payload[2].value > 0 && (
            <p style={{ fontSize: '14px' }}>{`Federal Republic: ${payload[2].value}`}</p>
          )}
          {payload[3] && payload[3].value > 0 && (
            <p style={{ fontSize: '14px' }}>{`Absolute Monarchy: ${payload[3].value}`}</p>
          )}
          {payload[4] && payload[4].value > 0 && (
            <p style={{ fontSize: '14px' }}>{`Parliamentary: ${payload[4].value}`}</p>
          )}
          {payload[5] && payload[5].value > 0 && (
            <p style={{ fontSize: '14px' }}>{`Republic with Stadtholder: ${payload[5].value}`}</p>
          )}
          {payload[6] && payload[6].value > 0 && (
            <p style={{ fontSize: '14px' }}>{`Other Governance: ${payload[6].value}`}</p>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <>
      {/* Add style tag for custom scrollbar CSS */}
      <style>{scrollbarStyles}</style>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="decade" 
            label={{ value: 'Decade', position: 'insideBottomRight', offset: -5 }}
          />
          <YAxis 
            label={{ value: 'Number of Crises', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={renderTimelineTooltip} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#1677FF" 
            strokeWidth={2} 
            dot={{ r: 5 }}
            activeDot={{ r: 8 }} 
            name="Total Crises"
          />
          {(showAllGovernance || governanceFilter.includes("Constitutional Monarchy")) && (
            <Line 
              type="monotone" 
              dataKey="constitutional" 
              stroke="#1677FF" 
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Constitutional Monarchy"
            />
          )}
          {(showAllGovernance || governanceFilter.includes("Federal Republic")) && (
            <Line 
              type="monotone" 
              dataKey="federal" 
              stroke="#36CFC9" 
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Federal Republic"
            />
          )}
          {(showAllGovernance || governanceFilter.includes("Absolute Monarchy")) && (
            <Line 
              type="monotone" 
              dataKey="absolute" 
              stroke="#FF4D4F" 
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Absolute Monarchy"
            />
          )}
          {(showAllGovernance || governanceFilter.includes("Parliamentary")) && (
            <Line 
              type="monotone" 
              dataKey="parliamentary" 
              stroke="#52C41A" 
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Parliamentary"
            />
          )}
          {(showAllGovernance || governanceFilter.includes("Republic with Stadtholder")) && (
            <Line 
              type="monotone" 
              dataKey="stadtholder" 
              stroke="#722ED1" 
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Republic with Stadtholder"
            />
          )}
          {(showAllGovernance || governanceFilter.includes("Other")) && (
            <Line 
              type="monotone" 
              dataKey="other" 
              stroke="#722ED1" 
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Other Governance"
            />
          )}
          <ReferenceLine x={2020} stroke="red" label="Present" />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default CrisesTimeline; 