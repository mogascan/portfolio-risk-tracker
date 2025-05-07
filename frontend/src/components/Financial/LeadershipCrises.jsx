import React, { useState } from 'react';
import DetailedCrisisTimeline from './DetailedCrisisTimeline';

const LeadershipCrises = () => {
  const [activeTab, setActiveTab] = useState("18th");
  const [expandedCrisis, setExpandedCrisis] = useState(null);

  // Data structure for crises by century
  const crisesByCentury = {
    "18th": [
      {
        year: 1720,
        name: "South Sea Bubble & Mississippi Bubble",
        leaders: [
          {
            name: "King George I",
            country: "Great Britain",
            years: "1714-1727",
            governance: "Constitutional Monarchy",
            style: "Monarch with limited powers; real political authority held by Parliament and ministers.",
            context: "The South Sea Company, granted a monopoly on trade in South America, became the center of speculative investment. The bubble burst in 1720, leading to economic turmoil and loss of public trust in financial institutions."
          },
          {
            name: "Philippe II, Duke of Orléans",
            country: "France",
            years: "1715-1723",
            governance: "Absolute Monarchy (Regency)",
            style: "Regent exercising royal authority during the minority of Louis XV.",
            context: "The Mississippi Company, led by John Law, was involved in speculative trading of French colonial territories. Its collapse mirrored the South Sea Bubble, causing financial distress in France."
          }
        ]
      },
      {
        year: 1763,
        name: "Amsterdam Banking Crisis",
        leaders: [
          {
            name: "Stadtholder William V of Orange",
            country: "Netherlands",
            years: "1751-1795",
            governance: "Republic with Stadtholder",
            style: "Hereditary stadtholder in a republic with significant merchant class influence.",
            context: "The crisis began with the collapse of the Amsterdam banking house of De Neufville, leading to widespread financial panic in Europe."
          }
        ]
      },
      {
        year: 1772,
        name: "British Credit Crisis",
        leaders: [
          {
            name: "King George III",
            country: "Great Britain",
            years: "1760-1820",
            governance: "Constitutional Monarchy",
            style: "Monarch with limited powers; significant influence of Parliament and emerging Prime Minister role.",
            context: "A credit boom, fueled by speculative investments and colonial trade, collapsed, leading to a banking crisis that affected both Britain and its American colonies."
          }
        ]
      },
      {
        year: 1783,
        name: "French Financial Crisis",
        leaders: [
          {
            name: "King Louis XVI",
            country: "France",
            years: "1774-1792",
            governance: "Absolute Monarchy",
            style: "Monarch with centralized power; faced increasing calls for reform.",
            context: "France's involvement in the Seven Years' War and the American Revolution led to massive debt. Attempts at financial reform were met with resistance from the nobility, contributing to the conditions that sparked the French Revolution."
          }
        ]
      },
      {
        year: 1792,
        name: "Panic of 1792",
        leaders: [
          {
            name: "President George Washington",
            country: "United States",
            years: "1789-1797",
            governance: "Federal Republic",
            style: "Democratic leadership under a constitution with checks and balances.",
            context: "The young nation's financial system faced its first major crisis due to speculative investments and lack of regulation, leading to a brief but significant economic downturn."
          }
        ]
      },
      {
        year: 1796,
        name: "Land Speculation Crisis",
        leaders: [
          {
            name: "King George III",
            country: "Great Britain",
            years: "1760-1820",
            governance: "Constitutional Monarchy",
            style: "Continued constitutional governance with parliamentary supremacy.",
            context: "Speculative investments in land, particularly in the American frontier, led to a financial bubble. Its burst caused economic distress in both Britain and the United States."
          },
          {
            name: "President John Adams",
            country: "United States",
            years: "1797-1801",
            governance: "Federal Republic",
            style: "Democratic leadership under the U.S. Constitution.",
            context: "The land speculation crisis impacted the U.S. economy, leading to bank failures and a credit crunch during the early years of Adams' presidency."
          }
        ]
      }
    ],
    "19th": [
      {
        year: 1819,
        name: "Panic of 1819",
        leaders: [
          {
            name: "President James Monroe",
            country: "United States",
            years: "1817-1825",
            governance: "Federal Republic",
            style: "Democratic leadership under the U.S. Constitution",
            context: "The first major financial crisis in the United States, triggered by post-war economic expansion, speculative lending practices, and the collapse of cotton prices. The crisis led to widespread foreclosures, bank failures, and a significant economic downturn."
          }
        ]
      },
      {
        year: 1837,
        name: "Panic of 1837",
        leaders: [
          {
            name: "President Martin Van Buren",
            country: "United States",
            years: "1837-1841",
            governance: "Federal Republic",
            style: "Democratic leadership under the U.S. Constitution",
            context: "A financial crisis marked by the collapse of the banking system, partly due to speculative lending and the policies of President Andrew Jackson, including the dismantling of the Second Bank of the United States. The panic led to a severe economic depression lasting several years."
          }
        ]
      },
      {
        year: 1857,
        name: "Panic of 1857",
        leaders: [
          {
            name: "President James Buchanan",
            country: "United States",
            years: "1857-1861",
            governance: "Federal Republic",
            style: "Democratic leadership under the U.S. Constitution",
            context: "An economic downturn caused by the declining international economy and over-expansion of the domestic economy. The failure of the Ohio Life Insurance and Trust Company sparked panic, leading to a widespread financial crisis."
          }
        ]
      },
      {
        year: 1866,
        name: "Panic of 1866",
        leaders: [
          {
            name: "Queen Victoria",
            country: "United Kingdom",
            years: "1837-1901",
            governance: "Constitutional Monarchy",
            style: "Monarch with ceremonial powers; real political authority held by Parliament and ministers",
            context: "The collapse of the London banking house Overend, Gurney and Company led to a financial panic. The crisis resulted in a severe credit crunch, numerous bank failures, and a significant economic downturn in the United Kingdom."
          }
        ]
      },
      {
        year: 1873,
        name: "Panic of 1873",
        leaders: [
          {
            name: "President Ulysses S. Grant",
            country: "United States",
            years: "1869-1877",
            governance: "Federal Republic",
            style: "Democratic leadership under the U.S. Constitution",
            context: "A financial crisis triggered by the collapse of Jay Cooke & Company, a major bank heavily invested in railroad construction. The panic led to a prolonged economic depression known as the 'Long Depression,' affecting both the United States and Europe."
          }
        ]
      },
      {
        year: 1884,
        name: "Panic of 1884",
        leaders: [
          {
            name: "President Chester A. Arthur",
            country: "United States",
            years: "1881-1885",
            governance: "Federal Republic",
            style: "Democratic leadership under the U.S. Constitution",
            context: "A financial panic caused by the failure of two New York City banks, leading to a loss of confidence in the financial system. The crisis resulted in a short but severe economic downturn."
          }
        ]
      },
      {
        year: 1890,
        name: "Baring Crisis",
        leaders: [
          {
            name: "Queen Victoria",
            country: "United Kingdom",
            years: "1837-1901",
            governance: "Constitutional Monarchy",
            style: "Monarch with ceremonial powers; real political authority held by Parliament and ministers",
            context: "The near-collapse of Baring Brothers, a major British bank, due to overexposure to Argentine debt. The crisis was mitigated by a consortium led by the Bank of England, preventing a broader financial meltdown."
          }
        ]
      },
      {
        year: 1893,
        name: "Panic of 1893",
        leaders: [
          {
            name: "President Grover Cleveland",
            country: "United States",
            years: "1893-1897",
            governance: "Federal Republic",
            style: "Democratic leadership under the U.S. Constitution",
            context: "A serious economic depression triggered by the collapse of railroad overbuilding and shaky railroad financing, resulting in a series of bank failures. The panic led to a significant economic downturn and high unemployment rates."
          }
        ]
      }
    ],
    "20th": [
      {
        year: 1907,
        name: "Panic of 1907",
        leaders: [
          {
            name: "President Theodore Roosevelt",
            country: "United States",
            years: "1901-1909",
            governance: "Federal Republic",
            style: "Progressive Republican; emphasized trust-busting and regulatory reforms.",
            context: "A banking crisis triggered by the collapse of the Knickerbocker Trust Company led to a nationwide panic. The lack of a central bank hindered effective response, prompting the eventual creation of the Federal Reserve System in 1913."
          }
        ]
      },
      {
        year: 1929,
        name: "Great Depression",
        leaders: [
          {
            name: "President Herbert Hoover",
            country: "United States",
            years: "1929-1933",
            governance: "Federal Republic",
            style: "Conservative Republican; favored limited government intervention.",
            context: "The stock market crash of 1929 precipitated a global economic downturn. Hoover's reluctance to implement aggressive federal relief measures contributed to prolonged economic hardship."
          },
          {
            name: "Prime Minister Ramsay MacDonald",
            country: "United Kingdom",
            years: "1929-1935",
            governance: "Constitutional Monarchy",
            style: "Labour Party leader; formed a National Government in response to the crisis.",
            context: "Faced with rising unemployment and economic instability, MacDonald's government implemented austerity measures, which were met with public discontent."
          }
        ]
      },
      {
        year: 1973,
        name: "Oil Crisis",
        leaders: [
          {
            name: "President Richard Nixon",
            country: "United States",
            years: "1969-1974",
            governance: "Federal Republic",
            style: "Republican; implemented wage and price controls.",
            context: "An oil embargo by OPEC nations led to skyrocketing energy prices, fueling inflation and economic stagnation in the U.S. and other industrialized nations."
          },
          {
            name: "Prime Minister Edward Heath",
            country: "United Kingdom",
            years: "1970-1974",
            governance: "Constitutional Monarchy",
            style: "Conservative; struggled with industrial unrest.",
            context: "The UK faced energy shortages and labor strikes, leading to the implementation of a three-day workweek to conserve electricity."
          }
        ]
      },
      {
        year: 1987,
        name: "Black Monday",
        leaders: [
          {
            name: "President Ronald Reagan",
            country: "United States",
            years: "1981-1989",
            governance: "Federal Republic",
            style: "Republican; advocated for deregulation and tax cuts.",
            context: "On October 19, 1987, global stock markets crashed, with the Dow Jones Industrial Average dropping 22.6% in a single day. The causes included program trading and market psychology."
          },
          {
            name: "Prime Minister Margaret Thatcher",
            country: "United Kingdom",
            years: "1979-1990",
            governance: "Constitutional Monarchy",
            style: "Conservative; promoted free-market policies",
            context: "The UK market mirrored global declines, but swift action by central banks helped stabilize the financial system."
          }
        ]
      }
    ],
    "21st": [
      {
        year: 2008,
        name: "Global Financial Crisis",
        leaders: [
          {
            name: "President George W. Bush",
            country: "United States",
            years: "2001-2009",
            governance: "Federal Republic",
            style: "Republican; initiated emergency economic measures.",
            context: "The collapse of Lehman Brothers and the subprime mortgage crisis led to a global financial meltdown. The Bush administration implemented the Troubled Asset Relief Program (TARP) to stabilize the banking sector."
          },
          {
            name: "Prime Minister Gordon Brown",
            country: "United Kingdom",
            years: "2007-2010",
            governance: "Constitutional Monarchy",
            style: "Labour; former Chancellor of the Exchequer.",
            context: "Brown's government nationalized key banks and coordinated international responses to the crisis, emphasizing the need for global financial regulation."
          }
        ]
      },
      {
        year: 2010,
        name: "Eurozone Debt Crisis",
        leaders: [
          {
            name: "Prime Minister George Papandreou",
            country: "Greece",
            years: "2009-2011",
            governance: "Parliamentary Republic",
            style: "Socialist; faced with mounting national debt.",
            context: "Revelations about Greece's budget deficit led to a loss of investor confidence, triggering a sovereign debt crisis that spread to other Eurozone countries."
          },
          {
            name: "Chancellor Angela Merkel",
            country: "Germany",
            years: "2005-2021",
            governance: "Federal Republic",
            style: "Christian Democrat; emphasized fiscal discipline.",
            context: "Germany played a central role in formulating bailout packages and advocating for austerity measures within the Eurozone."
          }
        ]
      },
      {
        year: 2020,
        name: "COVID-19 Pandemic Economic Crisis",
        leaders: [
          {
            name: "President Donald Trump",
            country: "United States",
            years: "2017-2021",
            governance: "Federal Republic",
            style: "Republican; implemented tax cuts and deregulation.",
            context: "The pandemic led to widespread economic shutdowns. The Trump administration passed the CARES Act to provide economic relief, including stimulus checks and support for businesses."
          },
          {
            name: "Prime Minister Boris Johnson",
            country: "United Kingdom",
            years: "2019-2022",
            governance: "Constitutional Monarchy",
            style: "Conservative; focused on Brexit implementation.",
            context: "The UK government introduced furlough schemes and business loans to mitigate the economic impact of lockdowns."
          }
        ]
      },
      {
        year: 2023,
        name: "Silicon Valley Bank Collapse",
        leaders: [
          {
            name: "President Joe Biden",
            country: "United States",
            years: "2021-Present",
            governance: "Federal Republic",
            style: "Democrat; emphasized economic recovery and regulation.",
            context: "The failure of Silicon Valley Bank, due to a bank run fueled by interest rate hikes and asset-liability mismatches, raised concerns about the stability of regional banks. The Biden administration worked with regulators to protect depositors and prevent contagion."
          }
        ]
      }
    ]
  };

  const toggleExpand = (index) => {
    if (expandedCrisis === index) {
      setExpandedCrisis(null);
    } else {
      setExpandedCrisis(index);
    }
  };

  const renderLeaderCard = (leader) => {
    return (
      <div key={`${leader.name}-${leader.country}`} style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #1677FF'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#e6f7ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            {/* Icon placeholder */}
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1677FF' }}>
              {leader.name.charAt(0)}
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{leader.name}</h4>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {leader.country} ({leader.years})
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '14px' }}>
            <span style={{ fontWeight: '500' }}>{leader.governance}</span>
          </div>
          
          <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            <span style={{ fontWeight: '500' }}>Leadership Style:</span> {leader.style}
          </div>
          
          <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            <span style={{ fontWeight: '500' }}>Crisis Context:</span> {leader.context}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#333' }}>Leadership During Financial Crises</h2>
      
      {/* Century Tabs */}
      <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '1px solid #eee' }}>
        <button
          key="all"
          onClick={() => setActiveTab("all")}
          style={{
            padding: '10px 16px',
            fontWeight: '500',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === "all" ? '#1677FF' : '#666',
            borderBottom: activeTab === "all" ? '2px solid #1677FF' : 'none'
          }}
        >
          All Centuries
        </button>
        {Object.keys(crisesByCentury).map((century) => (
          <button
            key={century}
            onClick={() => setActiveTab(century)}
            style={{
              padding: '10px 16px',
              fontWeight: '500',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === century ? '#1677FF' : '#666',
              borderBottom: activeTab === century ? '2px solid #1677FF' : 'none'
            }}
          >
            {century === "18th" ? "18th Century" : 
             century === "19th" ? "19th Century" : 
             century === "20th" ? "20th Century" : "21st Century"}
          </button>
        ))}
      </div>
      
      {/* Add DetailedCrisisTimeline visualization */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <DetailedCrisisTimeline activeTab={activeTab} />
      </div>
      
      {/* Crisis List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeTab === "all" 
          ? Object.values(crisesByCentury).flat().map((crisis, index) => (
            <div key={`${crisis.year}-${crisis.name}`} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: expandedCrisis === index ? '2px solid #1677FF' : '1px solid #eee',
              transition: 'all 0.2s ease'
            }}>
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  cursor: 'pointer',
                  backgroundColor: expandedCrisis === index ? '#f0f7ff' : 'white'
                }}
                onClick={() => toggleExpand(index)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#ff4d4f',
                      marginRight: '8px'
                    }}></span>
                    <span style={{ color: '#666', fontWeight: '500' }}>{crisis.year}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '4px' }}>{crisis.name}</h3>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                  {expandedCrisis === index ? (
                    <span>▲</span>
                  ) : (
                    <span>▼</span>
                  )}
                </button>
              </div>
              
              {expandedCrisis === index && (
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderTop: '1px solid #eee' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>LEADERS DURING CRISIS</h4>
                  <div>
                    {crisis.leaders.map((leader) => renderLeaderCard(leader))}
                  </div>
                </div>
              )}
            </div>
          ))
          : crisesByCentury[activeTab].map((crisis, index) => (
            <div key={`${crisis.year}-${crisis.name}`} style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: expandedCrisis === index ? '2px solid #1677FF' : '1px solid #eee',
              transition: 'all 0.2s ease'
            }}>
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  cursor: 'pointer',
                  backgroundColor: expandedCrisis === index ? '#f0f7ff' : 'white'
                }}
                onClick={() => toggleExpand(index)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: '#ff4d4f',
                      marginRight: '8px'
                    }}></span>
                    <span style={{ color: '#666', fontWeight: '500' }}>{crisis.year}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '4px' }}>{crisis.name}</h3>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                  {expandedCrisis === index ? (
                    <span>▲</span>
                  ) : (
                    <span>▼</span>
                  )}
                </button>
              </div>
              
              {expandedCrisis === index && (
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderTop: '1px solid #eee' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>LEADERS DURING CRISIS</h4>
                  <div>
                    {crisis.leaders.map((leader) => renderLeaderCard(leader))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Analysis Section */}
      <div style={{ 
        marginTop: '32px', 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Governance Analysis</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontWeight: '500', color: '#1677FF', marginBottom: '4px' }}>Constitutional Monarchies vs Republics</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Financial crises have occurred under both democratic republics and constitutional monarchies, 
              suggesting that governance structure alone is not determinative in preventing financial instability.
            </p>
          </div>
          
          <div>
            <h4 style={{ fontWeight: '500', color: '#1677FF', marginBottom: '4px' }}>Policy Response Evolution</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Leadership responses to financial crises have evolved from minimal intervention in the 18th-19th centuries 
              to increasingly coordinated and expansive government actions in the 20th-21st centuries.
            </p>
          </div>
          
          <div>
            <h4 style={{ fontWeight: '500', color: '#1677FF', marginBottom: '4px' }}>Crisis Frequency by Governance Type</h4>
            <div style={{ 
              marginTop: '8px', 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '12px' 
            }}>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Monarchies</span>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>38%</p>
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Republics</span>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>62%</p>
              </div>
              <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Other</span>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>0%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '13px', color: '#999', fontStyle: 'italic' }}>
        Note: This analysis focuses on political leadership during financial crises, examining the interplay between governance structures and economic instability across centuries.
      </div>
    </div>
  );
};

export default LeadershipCrises; 