import React, { useState, useEffect } from 'react';
import {
  Group, Text, Paper, Title, Button, Container, 
  Badge, Box, Card, Select, NumberInput, SimpleGrid, 
  RingProgress, List, ThemeIcon, Checkbox, Progress, Accordion, Stack, Table
} from '@mantine/core';
import {
  IconClock, IconChartBar, IconUsers, IconHistory, IconChevronDown, IconChevronUp,
  IconGlobe, IconCrown, IconBriefcase, IconActivity, IconTrendingUp, IconAlertTriangle,
  IconFilter, IconPlus, IconX, IconInfoCircle, IconFileText, IconCalendar, IconAdjustments,
  IconCoinBitcoin, IconCash, IconCalendarTime
} from '@tabler/icons-react';
import LeadershipAnalysis from './LeadershipAnalysis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import CrisesTimeline from './CrisesTimeline';
import useAppContext from './AppContext';

const IntegratedDashboard = () => {
  const [dashboardTab, setDashboardTab] = useState('timeline');
  
  return (
    <Container size="xl" px="xs">
      <Title order={2} mb="md">Strategic Timeline & Leadership Analysis</Title>
      <Text color="dimmed" mb="xl">Historical Patterns of Crisis, Innovation, and Leadership</Text>
      
      {/* Dashboard Navigation */}
      <Paper p="md" withBorder mb="xl">
        <Group>
          <Button
            onClick={() => setDashboardTab('timeline')}
            variant={dashboardTab === 'timeline' ? 'filled' : 'light'}
            leftIcon={<IconClock size={16} />}
          >
            Strategic Timeline
          </Button>
          <Button
            onClick={() => setDashboardTab('crises')}
            variant={dashboardTab === 'crises' ? 'filled' : 'light'}
            leftIcon={<IconCoinBitcoin size={16} />}
          >
            Crises
          </Button>
          <Button
            onClick={() => setDashboardTab('centuries')}
            variant={dashboardTab === 'centuries' ? 'filled' : 'light'}
            leftIcon={<IconCalendarTime size={16} />}
          >
            Centuries
          </Button>
          <Button
            onClick={() => setDashboardTab('leadership')}
            variant={dashboardTab === 'leadership' ? 'filled' : 'light'}
            leftIcon={<IconUsers size={16} />}
          >
            Leadership Analysis
          </Button>
          <Button
            onClick={() => setDashboardTab('combined')}
            variant={dashboardTab === 'combined' ? 'filled' : 'light'}
            leftIcon={<IconChartBar size={16} />}
          >
            Comprehensive View
          </Button>
        </Group>
      </Paper>

      {/* Dashboard Content */}
      <div>
        {dashboardTab === 'timeline' && <StrategicTimelineVisualization />}
        {dashboardTab === 'crises' && <CrisesView />}
        {dashboardTab === 'centuries' && <CenturiesView />}
        {dashboardTab === 'leadership' && <LeadershipAnalysis />}
        {dashboardTab === 'combined' && <CombinedView />}
      </div>
    </Container>
  );
};

// STRATEGIC TIMELINE VISUALIZATION COMPONENT
const StrategicTimelineVisualization = () => {
  const [activeTab, setActiveTab] = useState('filters');
  const [dateRange, setDateRange] = useState({ start: 1720, end: 2025 });
  const [focusCategory, setFocusCategory] = useState('all');
  const [showPatterns, setShowPatterns] = useState(true);
  const [insights, setInsights] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newEvent, setNewEvent] = useState({
    year: new Date().getFullYear(),
    event: '',
    category: 'Innovation',
    description: '',
    extendedDescription: '',
    impact: 7
  });
  const [expandedEventId, setExpandedEventId] = useState(null);
  
  // Tag colors for visualization
  const tagColors = {
    Crisis: "#ff4d4f",
    Innovation: "#52c41a",
    Shift: "#1890ff",
    Present: "#fa8c16"
  };
  
  // Historical events data
  const [events, setEvents] = useState([
    // 18th Century
    { id: 1, year: 1720, event: "South Sea Bubble", category: "Crisis", description: "Speculative mania ends in collapse", impact: 8, extendedDescription: "The South Sea Company was granted a monopoly to trade with South America, leading to wild speculation. Share prices rose from £100 to £1,000 in months before collapsing. The crash ruined thousands, including Isaac Newton who lost £20,000. This led to the Bubble Act of 1720, Britain's first securities regulation law." },
    { id: 2, year: 1763, event: "Amsterdam Banking Crisis", category: "Crisis", description: "Banking panic in Europe", impact: 7, extendedDescription: "The Amsterdam Banking Crisis of 1763 was triggered by the end of the Seven Years' War and the subsequent collapse of commodity prices. Several major Amsterdam banking houses that had overextended themselves during wartime speculation collapsed, leading to a chain reaction of failures across Europe. This crisis established an early pattern of boom-bust cycles in post-war economies, where wartime demand creates economic bubbles that burst when peace returns." },
    { id: 3, year: 1772, event: "British Credit Crisis", category: "Crisis", description: "Colonial trade collapse", impact: 6, extendedDescription: "The British Credit Crisis of 1772 began when the major London banking house Neal, James, Fordyce and Down collapsed due to speculative investments in East India Company stock. The panic spread to Scotland, where many banks had overextended credit to colonial American enterprises. This crisis severely restricted colonial American access to British credit and has been identified by historians as one of the economic grievances that contributed to the American Revolution." },
    { id: 4, year: 1792, event: "Panic of 1792", category: "Crisis", description: "First US financial panic", impact: 5, extendedDescription: "The Panic of 1792 was the first financial crisis faced by the newly formed United States. It was triggered by the speculative activities of William Duer, who attempted to corner the market on U.S. debt securities and Bank of New York stock. When Duer's scheme collapsed, it threatened to destabilize the fragile new American financial system. Treasury Secretary Alexander Hamilton intervened by providing liquidity to the markets, establishing the precedent for central bank intervention during financial crises that continues to this day." },
    
    // 19th Century
    { id: 5, year: 1819, event: "Panic of 1819", category: "Crisis", description: "First major US financial crisis", impact: 7, extendedDescription: "The Panic of 1819 was the first widespread economic crisis in the United States after the War of 1812. It featured widespread foreclosures, bank failures, unemployment, and a slump in agriculture and manufacturing. The panic was caused by global economic factors, including declining European demand for American exports and a general contraction of credit by the Second Bank of the United States. This crisis demonstrated the interconnected nature of the American and European economies and marked a significant shift toward American economic nationalism." },
    { id: 6, year: 1837, event: "Panic of 1837", category: "Crisis", description: "US banking panic, deep recession", impact: 8, extendedDescription: "The Panic of 1837 was one of the most severe financial crises in U.S. history, triggered by speculative lending practices, a collapsing land bubble, and President Andrew Jackson's Specie Circular, which required payment for government land in gold or silver. The crisis led to a five-year depression with bank failures, soaring unemployment (reaching 25% in some areas), and widespread business bankruptcies. This crisis shaped American banking for decades and contributed to the development of the Free Banking Era (1837-1863) when states, rather than the federal government, regulated banking." },
    { id: 7, year: 1857, event: "Panic of 1857", category: "Crisis", description: "Global economic downturn", impact: 7, extendedDescription: "The Panic of 1857 was the first global financial crisis, triggered by the failure of the Ohio Life Insurance and Trust Company and exacerbated by declining international trade, over-expansion of the domestic economy, and the dwindling gold supply caused by the California Gold Rush. The panic spread to Europe and led to a global economic downturn. In the United States, the crisis intensified sectional tensions between the North and South, as the Southern cotton economy recovered quickly while Northern industrial and financial interests suffered longer, contributing to the economic divisions that would help fuel the Civil War." },
    { id: 8, year: 1873, event: "Long Depression Begins", category: "Crisis", description: "Global deflation, rail overinvestment", impact: 9, extendedDescription: "The Long Depression, beginning with the Panic of 1873, was a worldwide economic crisis that lasted until 1879 in some countries and until 1896 in others. The crisis was triggered by the collapse of the Vienna Stock Exchange, the failure of Jay Cooke & Company (a major U.S. bank), and a bubble in railroad investments. This was the first crisis to clearly reveal the boom-bust cycle of industrial capitalism and saw widespread deflation, business failures, and unemployment. The depression transformed global economic thinking, leading to increased protectionism, the rise of labor unions, and eventually the emergence of modern central banking." },
    { id: 9, year: 1886, event: "First Gasoline Car (Benz)", category: "Innovation", description: "Birth of automotive age", impact: 10, extendedDescription: "Karl Benz's Patent-Motorwagen, introduced in 1886, is widely regarded as the world's first practical automobile powered by an internal combustion engine. This three-wheeled vehicle reaching speeds of 10 mph fundamentally changed transportation, urban development, and industrial production methods. It sparked the development of the global automotive industry that would transform economies worldwide in the 20th century." },
    { id: 10, year: 1893, event: "Panic of 1893", category: "Crisis", description: "Railroad collapse, bank failures", impact: 8, extendedDescription: "The Panic of 1893 was one of the worst economic crises in American history, triggered by railroad overbuilding and shaky railroad financing, which set off a series of bank failures. Compounded by the collapse of the Philadelphia and Reading Railroad, hundreds of banks closed, unemployment reached as high as 20%, and over 15,000 businesses failed. The crisis led to intense political debates about the gold standard, culminating in William Jennings Bryan's famous 'Cross of Gold' speech. This depression fundamentally reshaped American political alignments and contributed to the rise of the Progressive movement as a response to the excesses of the Gilded Age." },
    
    // 20th Century
    { id: 11, year: 1903, event: "Wright Brothers' First Flight", category: "Innovation", description: "Launch of aviation era", impact: 10, extendedDescription: "On December 17, 1903, Orville and Wilbur Wright achieved the first powered, sustained, and controlled airplane flight near Kitty Hawk, North Carolina. Their invention, which flew for just 12 seconds and 120 feet on its first flight, revolutionized transportation, warfare, global commerce, and cultural exchange. Within decades, aircraft evolved from fragile experimental craft to commercial airliners and military bombers. The aviation industry would become one of the largest sectors of the global economy, enabling unprecedented human mobility and shrinking the effective size of the world through rapid long-distance travel." },
    { id: 12, year: 1907, event: "Panic of 1907", category: "Crisis", description: "Banking crisis, led to Federal Reserve", impact: 7, extendedDescription: "The Panic of 1907, also known as the Knickerbocker Crisis, was a financial crisis triggered by a failed attempt to corner the stock of United Copper Company. When the scheme collapsed, it sparked runs on associated banks and trust companies, particularly the Knickerbocker Trust Company. With no central bank in existence, J.P. Morgan personally led efforts to stabilize the financial system by pledging large sums of his own money and convincing other New York bankers to do the same. The crisis directly led to the creation of the Federal Reserve System in 1913, establishing a central banking system in the United States to provide a more stable and flexible monetary and financial system." },
    { id: 13, year: 1929, event: "Great Depression", category: "Crisis", description: "Massive unemployment, bank failures", impact: 10, extendedDescription: "The Great Depression began with the stock market crash of October 1929 and became the worst economic crisis of modern times. U.S. unemployment rose to 25%, while global trade fell by 65%. Over 9,000 banks failed, wiping out millions of depositors' savings. The crisis triggered fundamental changes including the New Deal programs, banking reforms, and Keynesian economic policies that redefined the government's role in markets." },
    { id: 14, year: 1930, event: "Smoot-Hawley Tariffs", category: "Shift", description: "Protectionist trade war worsens global economy", impact: 8, extendedDescription: "The Smoot-Hawley Tariff Act of 1930 raised U.S. tariffs on over 20,000 imported goods to record levels, averaging 45-50%. Designed to protect American farmers and businesses, it instead sparked international retaliation, with 25 countries imposing counter-tariffs. Global trade collapsed 65% between 1929 and 1933, deepening and prolonging the Great Depression. This catastrophic policy mistake fundamentally shaped modern economic thinking about trade policy, providing the impetus for institutions like GATT and WTO, which dramatically liberalized global trade in subsequent decades. The tariffs' failure demonstrated how protectionism can transform economic downturns into prolonged systemic crises and cemented free trade as a cornerstone of post-WWII economic orthodoxy." },
    { id: 15, year: 1944, event: "Bretton Woods Agreement", category: "Shift", description: "Creates USD-gold monetary order", impact: 9, extendedDescription: "The Bretton Woods Agreement of 1944 established a new international monetary system with the U.S. dollar as the world's primary reserve currency, convertible to gold at $35 per ounce. It created the IMF and World Bank to stabilize exchange rates and facilitate reconstruction after WWII. This system provided the monetary stability that enabled unprecedented global economic growth for nearly three decades until it collapsed in 1971." },
    { id: 16, year: 1950, event: "Post-War Boom & Interstate", category: "Innovation", description: "Car ownership soars, suburbanization", impact: 8, extendedDescription: "The post-World War II economic boom in America was marked by unprecedented prosperity, with the Federal-Aid Highway Act of 1956 authorizing 41,000 miles of interstate highways. This massive infrastructure project, costing $25 billion (equivalent to $254 billion today), transformed American society by enabling mass suburbanization, creating the modern trucking industry, and cementing car culture in American life. The interstate system fundamentally altered urban development patterns, contributed to the decline of public transportation and inner cities, and reshaped the American landscape. Combined with the GI Bill, which provided housing loans to veterans, these developments created the modern American middle-class suburban lifestyle." },
    { id: 17, year: 1969, event: "Apollo 11 Moon Landing", category: "Innovation", description: "Peak of Cold War-era tech race", impact: 9, extendedDescription: "On July 20, 1969, NASA's Apollo 11 mission successfully landed astronauts Neil Armstrong and Buzz Aldrin on the Moon, the pinnacle achievement of the Space Race between the United States and Soviet Union. Beyond its geopolitical significance, the Apollo program drove unprecedented technological innovation, generating over 1,800 spinoff technologies including integrated circuits, satellite telecommunications, water purification systems, and advanced materials. The $25.4 billion program (equivalent to $180 billion today) represented one of the largest peacetime government investments in research and development, establishing a model for large-scale public technology initiatives and inspiring generations of scientists and engineers." },
    { id: 18, year: 1971, event: "Nixon Ends Gold Standard", category: "Shift", description: "USD decouples from gold — fiat era begins", impact: 10, extendedDescription: "On August 15, 1971, President Richard Nixon announced that the United States would no longer convert dollars to gold at a fixed value, effectively ending the Bretton Woods system and ushering in the era of freely floating fiat currencies. This decision, known as the 'Nixon Shock,' was driven by growing U.S. trade deficits, inflation, and declining gold reserves. The abandonment of the gold standard fundamentally transformed global finance, giving central banks greater flexibility in monetary policy but also removing a key constraint on money creation. This shift enabled both greater economic growth and periods of high inflation, while dramatically increasing the volatility of currency exchange rates and creating a new era of global financial markets." },
    { id: 19, year: 1973, event: "Oil Crisis", category: "Crisis", description: "OPEC embargo shocks energy prices", impact: 8, extendedDescription: "The 1973 Oil Crisis began when OPEC members, led by Saudi Arabia, declared an oil embargo against nations supporting Israel in the Yom Kippur War, primarily targeting the United States and its allies. Global oil prices quadrupled from $3 to $12 per barrel in just six months. The crisis caused severe gasoline shortages, inflation, and economic stagnation in the West, revealing the vulnerability of industrialized economies to oil supply disruptions. This watershed event ended the post-WWII era of cheap energy, sparked interest in energy conservation and alternative energy sources, and shifted economic and geopolitical power toward oil-producing nations, reshaping global politics for decades to come." },
    { id: 20, year: 1980, event: "Volcker Shock", category: "Crisis", description: "Fed rate hikes crush inflation and growth", impact: 8, extendedDescription: "The Volcker Shock refers to Federal Reserve Chairman Paul Volcker's decision to raise interest rates to unprecedented levels—peaking at 20% in 1981—to combat the stubborn inflation of the 1970s. This radical monetary tightening triggered a severe recession, with unemployment reaching 10.8% in 1982, but succeeded in bringing inflation down from 14.8% to below 3% by 1983. While causing significant short-term economic pain, these actions restored price stability and credibility to the Federal Reserve. The Volcker Shock represented a paradigm shift in monetary policy, establishing inflation control as the Federal Reserve's primary objective and demonstrating central banks' willingness to induce recessions if necessary to maintain price stability." },
    { id: 21, year: 1984, event: "Apple Macintosh Launch", category: "Innovation", description: "User-friendly computing revolution", impact: 9, extendedDescription: "The Apple Macintosh, introduced in January 1984 with the iconic '1984' Super Bowl commercial, was the first mass-market personal computer to feature a graphical user interface, built-in screen, and mouse. While these innovations were developed at Xerox PARC and implemented in Apple's earlier Lisa computer, the Macintosh made them affordable and accessible to ordinary consumers. This revolutionary approach to human-computer interaction—using visual metaphors like folders and a desktop instead of text commands—democratized computing by making it intuitive and accessible to non-technical users. The Macintosh established design principles that would influence virtually all subsequent personal computing devices, from Windows PCs to smartphones, creating the template for how billions of people would interact with technology." },
    { id: 22, year: 1987, event: "Black Monday", category: "Crisis", description: "Stock market drops 22.6% in one day", impact: 7, extendedDescription: "On October 19, 1987, global stock markets crashed, with the Dow Jones Industrial Average plummeting 22.6%—its largest one-day percentage drop in history. The causes included portfolio insurance, programmatic trading, overvaluation, and market psychology. Unlike previous crashes, Black Monday was characterized by the speed of the decline, accelerated by computerized trading programs that automatically executed sell orders as prices fell. The crisis prompted the introduction of market circuit breakers and other regulatory safeguards to prevent cascading market failures. It also demonstrated the increasingly interconnected nature of global financial markets, as the crash affected exchanges worldwide, and highlighted how technology could amplify market volatility rather than simply making markets more efficient." },
    { id: 23, year: 1994, event: "Bond Market Crash", category: "Crisis", description: "Rising rates shock debt markets", impact: 6, extendedDescription: "The 1994 Bond Market Crash occurred when the Federal Reserve unexpectedly began a series of interest rate hikes, causing the worst bond market decline in history at that time. As interest rates rose from 3% to 6%, bond prices collapsed, causing approximately $1.5 trillion in mark-to-market losses globally. The crisis was particularly devastating to leveraged investors and led to several high-profile financial disasters, including the bankruptcy of Orange County, California, and the collapse of many mortgage-backed securities firms. The crash highlighted the risks of derivative financial instruments, excess leverage, and interest rate sensitivity in fixed-income markets. It also demonstrated the powerful global impact of U.S. monetary policy decisions and led to calls for greater central bank transparency about policy intentions." },
    { id: 24, year: 1999, event: "Glass-Steagall Repeal", category: "Shift", description: "Banks re-consolidate; more systemic risk", impact: 8, extendedDescription: "The Gramm-Leach-Bliley Act of 1999 effectively repealed the Glass-Steagall Act of 1933, which had separated commercial banking from investment banking after the Great Depression. This deregulation allowed for the creation of financial supermarkets that could offer banking, insurance, securities, and other financial services under one roof. The repeal led to a wave of consolidation in the financial services industry, creating larger, more complex institutions that many critics later argued were 'too big to fail.' While proponents claimed the change would increase efficiency and competition, many economists and policymakers have since connected the repeal to the increased risk-taking and leverage that contributed to the 2008 financial crisis, as commercial banks became exposed to the higher-risk activities of investment banking." },
    
    // 21st Century
    { id: 25, year: 2000, event: "Dotcom Crash", category: "Crisis", description: "Tech bubble bursts", impact: 7, extendedDescription: "The Dotcom Crash of 2000-2002 marked the bursting of a massive speculative bubble in internet-related companies. From March 2000 to October 2002, the NASDAQ Composite lost 78% of its value, wiping out $5 trillion in market capitalization. The crash followed years of venture capital flowing into internet startups with unproven business models based primarily on capturing market share rather than profitability. Many companies famously burned through millions of dollars in investor capital before collapsing entirely. While devastating for investors, the crash ultimately separated viable internet businesses from those with unsustainable models, laying the groundwork for the more sustainable Web 2.0 era that followed. Companies that survived the crash, like Amazon and eBay, emerged stronger and became dominant global firms in the decades that followed." },
    { id: 26, year: 2001, event: "9/11 Attacks", category: "Shift", description: "War on Terror, global surveillance", impact: 9, extendedDescription: "The September 11, 2001 terrorist attacks in New York, Washington D.C., and Pennsylvania killed nearly 3,000 people and profoundly transformed global politics, economics, and society. Beyond the immediate financial impact—including the four-day closure of U.S. stock markets and $40 billion in insurance losses—9/11 led to massive government spending on homeland security and military operations. The subsequent War on Terror cost over $8 trillion and contributed to the U.S. fiscal deficit. Domestically, the attacks led to the creation of the Department of Homeland Security, expanded surveillance, and increased security measures that permanently changed industries from aviation to banking. The attacks also accelerated the militarization of technology and data collection, establishing patterns of public-private information sharing that continue to shape debates about privacy and security." },
    { id: 27, year: 2008, event: "Global Financial Crisis", category: "Crisis", description: "Mortgage crisis, Lehman collapse", impact: 10, extendedDescription: "The 2008 Global Financial Crisis was triggered by the collapse of the U.S. housing market and the subsequent failure of major financial institutions heavily invested in mortgage-backed securities. Lehman Brothers' bankruptcy on September 15, 2008 marked the largest bankruptcy filing in U.S. history ($600 billion) and accelerated the crisis. Global stock markets lost approximately $30 trillion in value, while U.S. households lost about $16 trillion in net worth. The crisis required unprecedented government interventions, including bank bailouts, near-zero interest rates, and quantitative easing programs that fundamentally reshaped monetary policy for the next decade." },
    { id: 28, year: 2008, event: "Bitcoin Whitepaper", category: "Innovation", description: "Launch of decentralized digital money", impact: 8, extendedDescription: "Published by the pseudonymous Satoshi Nakamoto amid the 2008 financial crisis, the Bitcoin whitepaper introduced a revolutionary peer-to-peer electronic cash system that operated without central authority. The blockchain technology underpinning Bitcoin solved the double-spending problem through distributed consensus and cryptographic proof-of-work. Bitcoin's creation sparked the development of thousands of cryptocurrencies and blockchain applications, challenging traditional financial systems and introducing concepts like decentralized finance (DeFi) and non-fungible tokens (NFTs)." },
    { id: 29, year: 2010, event: "Eurozone Debt Crisis", category: "Crisis", description: "Sovereign debt fears in EU periphery", impact: 7, extendedDescription: "The Eurozone Debt Crisis emerged when several European nations—primarily Greece, but also Ireland, Portugal, Spain, and Italy—faced unsustainable government debt levels and potential default. The crisis exposed fundamental flaws in the Eurozone's structure: a monetary union without fiscal integration or transfer mechanisms. As borrowing costs for affected countries soared, emergency bailouts were arranged, conditional on harsh austerity measures that caused deep recessions and social unrest. European Central Bank President Mario Draghi's 2012 pledge to do 'whatever it takes' to preserve the euro finally calmed markets, but the crisis revealed the tensions between national sovereignty and monetary union. It led to significant institutional reforms, including the European Stability Mechanism and Banking Union, and influenced the Brexit vote by highlighting controversies around European integration." },
    { id: 30, year: 2015, event: "Tesla Model S Takes Off", category: "Innovation", description: "Signals shift to electric mobility", impact: 7, extendedDescription: "The commercial success of the Tesla Model S marked the turning point when electric vehicles (EVs) transformed from niche eco-friendly alternatives to desirable high-performance vehicles capable of competing with traditional internal combustion engines. By combining long range (265 miles), high performance, advanced technology, and luxury design, Tesla proved that EVs could succeed in the mass market. The Model S's success forced established automakers to accelerate their electric vehicle plans, with virtually every major manufacturer subsequently announcing comprehensive EV strategies. Beyond transportation, Tesla's rise accelerated investment in battery technology and renewable energy, with implications for electricity grids, energy storage, and the transition away from fossil fuels across multiple industries." },
    { id: 31, year: 2017, event: "Crypto Bull Run", category: "Innovation", description: "Ethereum + altcoins surge", impact: 6, extendedDescription: "The 2017 Cryptocurrency Bull Run saw Bitcoin surge from $1,000 to nearly $20,000, while Ethereum rose from $8 to over $1,400 and the total cryptocurrency market cap reached $830 billion. This period was marked by the explosion of Initial Coin Offerings (ICOs), with over $5 billion raised for blockchain projects. The bull run brought cryptocurrencies into mainstream awareness, attracting institutional interest despite regulatory uncertainty. While the subsequent crash erased over 80% of market value, this cycle established cryptocurrencies as a recognized, if volatile, asset class. The period was particularly significant for establishing Ethereum and its smart contract capability as a platform for financial innovation beyond simple currency applications, laying the groundwork for the later development of decentralized finance (DeFi) and non-fungible tokens (NFTs)." },
    { id: 32, year: 2020, event: "COVID Crash", category: "Crisis", description: "Lockdowns, liquidity crunch", impact: 9, extendedDescription: "The COVID-19 pandemic triggered the fastest global market crash in history. Between February 19 and March 23, 2020, the S&P 500 fell 34%. Oil futures briefly traded at negative prices for the first time ever. Central banks responded with unprecedented monetary stimulus - the Fed cut rates to near-zero and expanded its balance sheet by $3 trillion in three months. Global governments deployed over $10 trillion in fiscal stimulus. These interventions created the fastest recovery from a bear market in history but also contributed to subsequent inflation pressures and asset bubbles." },
    { id: 33, year: 2023, event: "AI Acceleration (ChatGPT)", category: "Innovation", description: "Generative AI revolution", impact: 9, extendedDescription: "The release of ChatGPT in November 2022 and subsequent large language models in 2023 marked an inflection point for artificial intelligence, bringing powerful generative AI capabilities to mainstream users. These systems demonstrated unprecedented abilities in natural language processing, creative content generation, and coding assistance, moving AI from specialized applications to general-purpose tools accessible to everyday users. The technology triggered massive investment—with over $100 billion flowing into AI startups—and fueled the largest tech stock rally since the dotcom era. While creating economic opportunities, generative AI also raised concerns about job displacement, misinformation, copyright infringement, and algorithmic bias. The rapid deployment of these systems globally represented a technological shift comparable to the introduction of the internet or smartphones, with potential to transform virtually every knowledge-based industry." },
    { id: 34, year: 2023, event: "SVB Collapse", category: "Crisis", description: "Tech banking fragility exposed", impact: 6, extendedDescription: "The March 2023 collapse of Silicon Valley Bank (SVB)—the 16th largest U.S. bank and banker to nearly half of all U.S. venture-backed startups—marked the largest bank failure since the 2008 crisis. The bank's downfall was triggered by rising interest rates that created large unrealized losses in its long-term government bond portfolio, combined with a liquidity crunch as depositors (mostly tech companies) withdrew funds during the tech industry downturn. When SVB announced a capital raise to cover losses, it sparked a bank run accelerated by social media and digital banking, with $42 billion withdrawn in a single day. The crisis revealed vulnerabilities in mid-sized banks with concentrated deposit bases and mismatched asset-liability durations. Authorities responded by guaranteeing all deposits and creating a new Federal Reserve lending facility, effectively extending the implicit government safety net beyond systemically important banks." },
    { id: 35, year: 2023, event: "Israel-Palestine War", category: "Shift", description: "Middle East instability", impact: 7, extendedDescription: "The October 7, 2023 Hamas attack on Israel and the subsequent Israeli military response in Gaza sparked the deadliest Israel-Hamas conflict in decades, with significant regional and global economic implications. Beyond the humanitarian crisis, the conflict disrupted Middle Eastern shipping routes, threatened oil supplies, and increased global defense spending. The war also accelerated geopolitical realignments across the Middle East, complicating U.S.-Saudi normalization efforts and impacting China's regional influence. Financial effects included increased volatility in energy markets, higher insurance costs for shipping, and substantial market impacts in Israel, where the shekel fell to an eight-year low and the Tel Aviv Stock Exchange dropped significantly. The conflict added another element of uncertainty to a global economy already facing multiple crises, reinforcing the trend toward fragmentation of the global economic order." },
    { id: 36, year: 2024, event: "BRICS Trade Realignment", category: "Shift", description: "De-dollarization and new alliances", impact: 8, extendedDescription: "The expansion of the BRICS bloc in 2024 marked a significant shift in global economic alliances, with Saudi Arabia, Iran, Egypt, Ethiopia, and the UAE joining Brazil, Russia, India, China, and South Africa. Representing over 45% of the global population and 36% of GDP, the expanded bloc accelerated efforts to reduce dollar dependence by developing alternative payment systems, settlement mechanisms, and potentially a new reserve currency. This realignment challenged the Western-dominated financial order established after World War II, reflecting dissatisfaction with dollar hegemony and Western financial sanctions. While not replacing the dollar outright, these initiatives created a more multipolar financial system with competing economic spheres of influence, fundamentally altering global trade flows and investment patterns while contributing to the fragmentation of the global economy into regional blocs." },
    { id: 37, year: 2025, event: "YOU ARE HERE", category: "Present", description: "Strategic thinking required", impact: 10, extendedDescription: "The year 2025 represents the convergence point of multiple transformative trends reshaping the global economy: artificial intelligence deployment across industries, climate-driven energy transition, reorganization of global supply chains, monetary policy normalization after an era of unprecedented intervention, and the continued fragmentation of the global trading system into competing economic blocs. This complex environment combines significant systemic risks—including high global debt levels, climate instability, and geopolitical tensions—with breakthrough technological opportunities that could drive productivity and growth. Organizations and individuals navigating this landscape face both heightened uncertainty and expanded possibilities, requiring strategic thinking that integrates multiple disciplines and timescales." }
  ]);
  
  // Define patterns (to be overlaid on the timeline)
  const patterns = [
    {
      id: 1,
      name: "Innovation Acceleration",
      startYear: 1980,
      endYear: 2025,
      description: "Increasing frequency of technological breakthroughs",
      color: "rgba(82, 196, 26, 0.15)"
    },
    {
      id: 2,
      name: "Crisis Cycle ~25 Years",
      periods: [
        { start: 1720, end: 1745 },
        { start: 1870, end: 1895 },
        { start: 1929, end: 1954 },
        { start: 1973, end: 1998 },
        { start: 2008, end: 2033 }
      ],
      description: "Major financial crises occur in ~25 year cycles",
      color: "rgba(255, 77, 79, 0.15)"
    },
    {
      id: 3,
      name: "Monetary System Shifts",
      years: [1944, 1971, 1999, 2008, 2024],
      description: "Major changes to monetary frameworks",
      color: "rgba(24, 144, 255, 0.15)"
    },
    {
      id: 4,
      name: "Convergence Zone",
      startYear: 2020,
      endYear: 2030,
      description: "Unprecedented overlap of crises, shifts, and innovations",
      color: "rgba(250, 140, 22, 0.25)"
    }
  ];
  
  useEffect(() => {
    calculateInsights();
  }, [events]);

  // Filter events based on the current category focus and date range
  const filteredEvents = events.filter(event => {
    const withinDateRange = event.year >= dateRange.start && event.year <= dateRange.end;
    const matchesCategory = focusCategory === 'all' || event.category === focusCategory;
    return withinDateRange && matchesCategory;
  });
  
  // Calculate insights
  const calculateInsights = () => {
    // Count events by type
    const crisisEvents = events.filter(e => e.category === "Crisis");
    const innovationEvents = events.filter(e => e.category === "Innovation");
    const shiftEvents = events.filter(e => e.category === "Shift");
    
    // Calculate average time between events
    const calculateAvgTimeBetween = (eventList) => {
      if (eventList.length <= 1) return "N/A";
      
      const sortedYears = eventList.map(e => e.year).sort((a, b) => a - b);
      let totalGap = 0;
      let gapCount = 0;
      
      for (let i = 1; i < sortedYears.length; i++) {
        totalGap += sortedYears[i] - sortedYears[i-1];
        gapCount++;
      }
      
      return gapCount > 0 ? (totalGap / gapCount).toFixed(1) : "N/A";
    };
    
    setInsights({
      crisisCount: crisisEvents.length,
      innovationCount: innovationEvents.length,
      shiftCount: shiftEvents.length,
      presentCount: events.filter(e => e.category === "Present").length,
      crisisAvgGap: calculateAvgTimeBetween(crisisEvents),
      innovationAvgGap: calculateAvgTimeBetween(innovationEvents),
      shiftAvgGap: calculateAvgTimeBetween(shiftEvents)
    });
  };

  // Handle adding a new event
  const handleAddEvent = () => {
    if (newEvent.event && newEvent.description) {
      const newEventId = events.length + 1;
      setEvents([...events, { 
        ...newEvent, 
        id: newEventId, 
        extendedDescription: newEvent.extendedDescription || newEvent.description 
      }]);
      
      // Reset form
      setNewEvent({
        year: new Date().getFullYear(),
        event: '',
        category: 'Innovation',
        description: '',
        extendedDescription: '',
        impact: 7
      });
      
      // Switch back to filters tab
      setActiveTab('filters');
    }
  };
  
  // Get color for category
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Crisis': return 'red';
      case 'Innovation': return 'green';
      case 'Shift': return 'blue';
      case 'Present': return 'orange';
      default: return 'gray';
    }
  };

  // Prepare data for timeline chart
  const timelineData = [];
  const startYear = dateRange.start;
  const endYear = dateRange.end;
  
  for (let year = startYear; year <= endYear; year += 10) {
    const dataPoint = { year };
    const eventsInYear = filteredEvents.filter(e => e.year >= year && e.year < year + 10);
    
    dataPoint.Crisis = eventsInYear.filter(e => e.category === "Crisis").length;
    dataPoint.Innovation = eventsInYear.filter(e => e.category === "Innovation").length;
    dataPoint.Shift = eventsInYear.filter(e => e.category === "Shift").length;
    dataPoint.Present = eventsInYear.filter(e => e.category === "Present").length;
    
    timelineData.push(dataPoint);
  }

  // Prepare scatter data for the detailed timeline
  const getScatterData = () => {
    return filteredEvents.map(event => ({
      year: event.year,
      value: event.category,
      tag: event.category,
      event: event.event,
      description: event.description,
      id: event.id
    }));
  };

  const renderTooltip = (props) => {
    const { payload } = props;
    if (!payload || payload.length === 0) return null;
    
    const data = payload[0].payload;
    
    return (
      <Paper p="md" shadow="md" withBorder>
        <Text fw={700}>{data.year}: {data.event}</Text>
        <Text size="sm">{data.description}</Text>
        <Text size="xs" fw={500} c={tagColors[data.tag]} mt="xs">{data.tag}</Text>
      </Paper>
    );
  };

  // Toggle expanded state for an event
  const toggleEventExpanded = (eventId) => {
    setExpandedEventId(prev => prev === eventId ? null : eventId);
  };

  return (
    <Paper p="xl" withBorder>
      <Group position="apart" mb="lg">
        <Title order={3} style={{ display: 'flex', alignItems: 'center' }}>
          <IconCalendar size={24} style={{ marginRight: '0.75rem' }} />
          Strategic Timeline Visualization
        </Title>
        
        <Group spacing="sm">
          <Button 
            onClick={() => setActiveTab('filters')}
            variant={activeTab === 'filters' ? 'filled' : 'light'}
            size="sm"
            leftIcon={<IconFilter size={16} />}
          >
            Event Filters
          </Button>
          <Button 
            onClick={() => setActiveTab('add')}
            variant={activeTab === 'add' ? 'filled' : 'light'}
            size="sm"
            leftIcon={<IconPlus size={16} />}
          >
            Add Event
          </Button>
        </Group>
      </Group>
      
      {activeTab === 'filters' && (
        <Paper p="sm" withBorder mb="xl">
          <Group position="apart" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
            <Group spacing="xs">
              <IconActivity size={18} />
              <Text weight={500} size="sm">Event Filters</Text>
            </Group>
            <Group spacing="xs" style={{ alignItems: 'center' }}>
              <IconFilter size={14} />
              <Checkbox 
                label="Show Patterns" 
                checked={showPatterns}
                onChange={(event) => setShowPatterns(event.currentTarget.checked)}
                size="xs"
                styles={{ label: { fontSize: '12px' } }}
              />
            </Group>
          </Group>
          
          <Group position="apart" align="flex-start" style={{ flexWrap: 'nowrap' }}>
            <div style={{ flex: '1 1 auto' }}>
              <Text weight={500} size="xs" mb="xs">Filter by Type</Text>
              <Group spacing="xs" mb="xs">
                <Button 
                  variant={focusCategory === 'all' ? 'filled' : 'light'} 
                  color="gray"
                  onClick={() => setFocusCategory('all')}
                  size="xs"
                  compact
                  style={{ 
                    backgroundColor: focusCategory === 'all' ? 'var(--mantine-color-gray-1)' : 'transparent',
                    border: '1px solid var(--mantine-color-gray-3)',
                    color: 'var(--mantine-color-dark-6)',
                    padding: '0 8px',
                    height: '28px'
                  }}
                >
                  All
                </Button>
                <Button 
                  variant={focusCategory === 'Crisis' ? 'filled' : 'light'} 
                  color="red"
                  onClick={() => setFocusCategory('Crisis')}
                  size="xs"
                  compact
                  style={{ 
                    backgroundColor: focusCategory === 'Crisis' ? 'var(--mantine-color-red-0)' : 'transparent',
                    border: '1px solid var(--mantine-color-red-2)',
                    color: tagColors.Crisis,
                    padding: '0 8px',
                    height: '28px'
                  }}
                >
                  Crisis
                </Button>
                <Button 
                  variant={focusCategory === 'Innovation' ? 'filled' : 'light'} 
                  color="green"
                  onClick={() => setFocusCategory('Innovation')}
                  size="xs"
                  compact
                  style={{ 
                    backgroundColor: focusCategory === 'Innovation' ? 'var(--mantine-color-green-0)' : 'transparent',
                    border: '1px solid var(--mantine-color-green-2)',
                    color: tagColors.Innovation,
                    padding: '0 8px',
                    height: '28px'
                  }}
                >
                  Innovation
                </Button>
                <Button 
                  variant={focusCategory === 'Shift' ? 'filled' : 'light'} 
                  color="blue"
                  onClick={() => setFocusCategory('Shift')}
                  size="xs"
                  compact
                  style={{ 
                    backgroundColor: focusCategory === 'Shift' ? 'var(--mantine-color-blue-0)' : 'transparent',
                    border: '1px solid var(--mantine-color-blue-2)',
                    color: tagColors.Shift,
                    padding: '0 8px',
                    height: '28px'
                  }}
                >
                  Shift
                </Button>
                <Button 
                  variant={focusCategory === 'Present' ? 'filled' : 'light'} 
                  color="orange"
                  onClick={() => setFocusCategory('Present')}
                  size="xs"
                  compact
                  style={{ 
                    backgroundColor: focusCategory === 'Present' ? 'var(--mantine-color-orange-0)' : 'transparent',
                    border: '1px solid var(--mantine-color-orange-2)',
                    color: tagColors.Present,
                    padding: '0 8px',
                    height: '28px'
                  }}
                >
                  Present
                </Button>
              </Group>
            </div>
            
            <div style={{ minWidth: '280px', marginLeft: '1rem' }}>
              <Text weight={500} size="xs" mb="xs">Time Range</Text>
              <Group spacing="xs" noWrap>
                <div>
                  <NumberInput 
                    value={dateRange.start}
                    onChange={(value) => setDateRange({...dateRange, start: value})}
                    min={1700}
                    max={2025}
                    size="xs"
                    styles={{
                      input: { 
                        height: '28px',
                        fontSize: '12px'
                      },
                      wrapper: {
                        width: '90px'
                      }
                    }}
                    rightSection={null}
                  />
                </div>
                <Text size="xs" style={{ margin: '0 4px' }}>—</Text>
                <div>
                  <NumberInput 
                    value={dateRange.end}
                    onChange={(value) => setDateRange({...dateRange, end: value})}
                    min={1700}
                    max={2025}
                    size="xs"
                    styles={{
                      input: { 
                        height: '28px',
                        fontSize: '12px'
                      },
                      wrapper: {
                        width: '90px'
                      }
                    }}
                    rightSection={null}
                  />
                </div>
              </Group>
            </div>
          </Group>
        </Paper>
      )}
      
      {activeTab === 'add' && (
        <Paper p="md" withBorder mb="xl" data-add-event-form>
          <Group mb="md" position="apart">
            <Group>
              <IconPlus size={18} />
              <Title order={4}>Add New Event</Title>
            </Group>
            <Button
              variant={editMode ? "filled" : "light"}
              size="xs"
              color="blue"
              onClick={() => setEditMode(!editMode)}
            >
              Edit Mode
            </Button>
          </Group>
          
          <div>
            <Text weight={500} size="sm" mb="xs">Year</Text>
            <NumberInput
              value={newEvent.year}
              onChange={(value) => setNewEvent({...newEvent, year: value})}
              min={1700}
              max={2100}
              styles={{
                input: { height: '36px' }
              }}
            />
            
            <Text weight={500} size="sm" mb="xs" mt="md">Event Name</Text>
            <input
              type="text"
              value={newEvent.event}
              onChange={(e) => setNewEvent({...newEvent, event: e.target.value})}
              placeholder="Enter event name"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: '4px',
                fontSize: '14px',
                height: '36px'
              }}
            />
            
            <Text weight={500} size="sm" mb="xs" mt="md">Type</Text>
            <Select
              value={newEvent.category}
              onChange={(value) => setNewEvent({...newEvent, category: value})}
              data={[
                { value: 'Crisis', label: 'Crisis' },
                { value: 'Innovation', label: 'Innovation' },
                { value: 'Shift', label: 'Shift' },
                { value: 'Present', label: 'Present' }
              ]}
              styles={{
                input: { height: '36px' }
              }}
            />
            
            <Text weight={500} size="sm" mb="xs" mt="md">Description</Text>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              placeholder="Enter event description"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: '4px',
                minHeight: '80px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            
            <Text weight={500} size="sm" mb="xs" mt="md">Historical Context (optional)</Text>
            <textarea
              value={newEvent.extendedDescription}
              onChange={(e) => setNewEvent({...newEvent, extendedDescription: e.target.value})}
              placeholder="Enter historical context for this event"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: '4px',
                minHeight: '100px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            
            <Button
              fullWidth
              onClick={handleAddEvent}
              size="md"
              mt="xl"
              disabled={!newEvent.event || !newEvent.description}
              style={{
                backgroundColor: !newEvent.event || !newEvent.description ? 'var(--mantine-color-gray-2)' : undefined,
              }}
            >
              Add Event
            </Button>
          </div>
        </Paper>
      )}
      
      {/* Strategic Timeline Visualization from StrategicTimelineComponent */}
      <Paper p="md" withBorder shadow="sm" mb="xl">
        <Title order={4} mb="lg" style={{ display: 'flex', alignItems: 'center' }}>
          <IconClock size={18} style={{ marginRight: '0.5rem' }} />
          Strategic Timeline Visualization
        </Title>
        
        <div style={{ height: '250px', marginBottom: '1.8rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                label={{ value: 'Year', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Event Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Crisis" stroke={tagColors.Crisis} strokeWidth={2} />
              <Line type="monotone" dataKey="Innovation" stroke={tagColors.Innovation} strokeWidth={2} />
              <Line type="monotone" dataKey="Shift" stroke={tagColors.Shift} strokeWidth={2} />
              <Line type="monotone" dataKey="Present" stroke={tagColors.Present} strokeWidth={2} />
              {showPatterns && patterns.filter(p => p.name === "Crisis Cycle ~25 Years").map(pattern => 
                pattern.periods.map((period, i) => (
                  <ReferenceLine 
                    key={`ref-${i}`} 
                    x={period.start} 
                    stroke={pattern.color.replace("0.15", "0.8")} 
                    strokeDasharray="3 3" 
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={getScatterData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 15 }}
            >
              <XAxis 
                dataKey="year"
                type="number"
                domain={[dateRange.start, dateRange.end]}
                allowDataOverflow
              />
              <YAxis 
                type="category" 
                dataKey="tag" 
                width={80}
                tickFormatter={(value) => value}
              />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip content={renderTooltip} />
              
              {/* Plot Crisis events */}
              {filteredEvents.filter(e => e.category === "Crisis").map((event) => (
                <Line 
                  key={`dot-${event.id}`}
                  type="monotone" 
                  dataKey="value" 
                  data={[{
                    year: event.year,
                    value: "Crisis",
                    tag: event.category,
                    event: event.event,
                    description: event.description,
                    id: event.id
                  }]}
                  stroke={tagColors.Crisis} 
                  dot={{ 
                    r: 7, 
                    fill: tagColors.Crisis, 
                    strokeWidth: 1, 
                    stroke: "#fff",
                    onClick: () => setSelectedEvent(event)
                  }}
                  activeDot={{ 
                    r: 10, 
                    onClick: () => setSelectedEvent(event)
                  }}
                  isAnimationActive={false}
                />
              ))}
              
              {/* Plot Innovation events */}
              {filteredEvents.filter(e => e.category === "Innovation").map((event) => (
                <Line 
                  key={`dot-${event.id}`}
                  type="monotone" 
                  dataKey="value" 
                  data={[{
                    year: event.year,
                    value: "Innovation",
                    tag: event.category,
                    event: event.event,
                    description: event.description,
                    id: event.id
                  }]}
                  stroke={tagColors.Innovation} 
                  dot={{ 
                    r: 7, 
                    fill: tagColors.Innovation, 
                    strokeWidth: 1, 
                    stroke: "#fff",
                    onClick: () => setSelectedEvent(event)
                  }}
                  activeDot={{ 
                    r: 10, 
                    onClick: () => setSelectedEvent(event)
                  }}
                  isAnimationActive={false}
                />
              ))}
              
              {/* Plot Shift events */}
              {filteredEvents.filter(e => e.category === "Shift").map((event) => (
                <Line 
                  key={`dot-${event.id}`}
                  type="monotone" 
                  dataKey="value" 
                  data={[{
                    year: event.year,
                    value: "Shift",
                    tag: event.category,
                    event: event.event,
                    description: event.description,
                    id: event.id
                  }]}
                  stroke={tagColors.Shift} 
                  dot={{ 
                    r: 7, 
                    fill: tagColors.Shift, 
                    strokeWidth: 1, 
                    stroke: "#fff",
                    onClick: () => setSelectedEvent(event)
                  }}
                  activeDot={{ 
                    r: 10, 
                    onClick: () => setSelectedEvent(event)
                  }}
                  isAnimationActive={false}
                />
              ))}
              
              {/* Plot Present events */}
              {filteredEvents.filter(e => e.category === "Present").map((event) => (
                <Line 
                  key={`dot-${event.id}`}
                  type="monotone" 
                  dataKey="value" 
                  data={[{
                    year: event.year,
                    value: "Present",
                    tag: event.category,
                    event: event.event,
                    description: event.description,
                    id: event.id
                  }]}
                  stroke={tagColors.Present} 
                  dot={{ 
                    r: 7, 
                    fill: tagColors.Present, 
                    strokeWidth: 1, 
                    stroke: "#fff",
                    onClick: () => setSelectedEvent(event)
                  }}
                  activeDot={{ 
                    r: 10, 
                    onClick: () => setSelectedEvent(event)
                  }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <Text align="center" size="sm" c="dimmed" mt="md">
            Click on any dot to view details
          </Text>
        </div>
      </Paper>
      
      {/* Selected Event Card */}
      {selectedEvent && (
        <Paper p="md" withBorder shadow="sm" mb="xl" data-selected-event-card style={{ position: 'relative' }}>
          <Button 
            variant="subtle" 
            color="gray" 
            compact
            onClick={() => setSelectedEvent(null)}
            style={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              padding: 0,
              width: '24px',
              height: '24px',
              borderRadius: '50%'
            }}
          >
            <IconX size={16} color="red" />
          </Button>
          
          <Group spacing="xs" mb="xs">
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: tagColors[selectedEvent.category] }}></div>
            <Text size="sm" fw={500} c="dimmed">{selectedEvent.category}</Text>
          </Group>
          
          <Title order={4}>{selectedEvent.year}: {selectedEvent.event}</Title>
          <Text mt="md">{selectedEvent.description}</Text>
          
          {selectedEvent.extendedDescription && (
            <>
              <Title order={5} mt="xl" mb="xs">Historical Context</Title>
              <Text>{selectedEvent.extendedDescription}</Text>
            </>
          )}
        </Paper>
      )}
      
      {/* Analysis Section */}
      <SimpleGrid cols={2} spacing="lg">
        <Paper p="md" withBorder style={{ background: 'var(--mantine-color-gray-0)' }}>
          <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
            <IconChartBar size={20} style={{ marginRight: '0.5rem', color: 'var(--mantine-color-blue-6)' }} />
            Event Distribution
          </Title>
          
          <div>
            <Group mb="md">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-6)', marginRight: '0.5rem' }}></div>
                <Text size="sm">Crisis Events: <Text weight={700} span>{events.filter(e => e.category === 'Crisis').length}</Text></Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-green-6)', marginRight: '0.5rem' }}></div>
                <Text size="sm">Innovation Events: <Text weight={700} span>{events.filter(e => e.category === 'Innovation').length}</Text></Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-6)', marginRight: '0.5rem' }}></div>
                <Text size="sm">Shift Events: <Text weight={700} span>{events.filter(e => e.category === 'Shift').length}</Text></Text>
              </div>
            </Group>
              
            <Title order={5} mt="lg" mb="sm">Average Years Between Events:</Title>
            <SimpleGrid cols={3}>
              <Paper p="sm" radius="md" style={{ background: 'var(--mantine-color-red-0)' }}>
                <Text align="center" size="xs" color="red">Crisis</Text>
                <Text align="center" weight={700}>{insights.crisisAvgGap || "25.2"} yrs</Text>
              </Paper>
              <Paper p="sm" radius="md" style={{ background: 'var(--mantine-color-green-0)' }}>
                <Text align="center" size="xs" color="green">Innovation</Text>
                <Text align="center" weight={700}>{insights.innovationAvgGap || "15.2"} yrs</Text>
              </Paper>
              <Paper p="sm" radius="md" style={{ background: 'var(--mantine-color-blue-0)' }}>
                <Text align="center" size="xs" color="blue">Shift</Text>
                <Text align="center" weight={700}>{insights.shiftAvgGap || "15.7"} yrs</Text>
              </Paper>
            </SimpleGrid>
            
            <div style={{ height: '180px', marginTop: '1rem', borderRadius: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Crisis', value: insights.crisisCount, color: tagColors.Crisis },
                      { name: 'Innovation', value: insights.innovationCount, color: tagColors.Innovation },
                      { name: 'Shift', value: insights.shiftCount, color: tagColors.Shift },
                      { name: 'Present', value: insights.presentCount, color: tagColors.Present }
                    ]}
                    cx="50%"
                    cy="60%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={(entry) => {
                      // Only show percentage to make labels more compact
                      return `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`;
                    }}
                    labelLine={true}
                  >
                    {[
                      { name: 'Crisis', value: insights.crisisCount, color: tagColors.Crisis },
                      { name: 'Innovation', value: insights.innovationCount, color: tagColors.Innovation },
                      { name: 'Shift', value: insights.shiftCount, color: tagColors.Shift },
                      { name: 'Present', value: insights.presentCount, color: tagColors.Present }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} events`, name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Paper>
        
        <Paper p="md" withBorder style={{ background: 'var(--mantine-color-gray-0)' }}>
          <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
            <IconTrendingUp size={20} style={{ marginRight: '0.5rem', color: 'var(--mantine-color-blue-6)' }} />
            Pattern Analysis
          </Title>
          
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <Group spacing="xs" mb="xs">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-2)' }}></div>
                <Text weight={500} size="sm">Crisis Cycles (~{insights.crisisAvgGap || "25.2"} years)</Text>
              </Group>
              <Text size="sm" color="dimmed">
                Major financial crises appear to occur in predictable cycles averaging {insights.crisisAvgGap || "25.2"} years. 
                From the South Sea Bubble to COVID, these represent fragile points in global financial architecture.
              </Text>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <Group spacing="xs" mb="xs">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-green-2)' }}></div>
                <Text weight={500} size="sm">Innovation Acceleration</Text>
              </Group>
              <Text size="sm" color="dimmed">
                Once occurring every 20-30 years, innovations now happen every {insights.innovationAvgGap || "15.2"} years with 
                multiple overlapping breakthroughs. This suggests compounding technological disruption.
              </Text>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <Group spacing="xs" mb="xs">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-2)' }}></div>
                <Text weight={500} size="sm">Structural Shifts</Text>
              </Group>
              <Text size="sm" color="dimmed">
                Policy and monetary shifts (averaging every {insights.shiftAvgGap || "15.7"} years) are often responses to 
                crisis or innovation—reflecting adaptation, with long-term consequences.
              </Text>
            </div>
            
            <div>
              <Group spacing="xs" mb="xs">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--mantine-color-orange-2)' }}></div>
                <Text weight={500} size="sm">2020s Convergence Zone</Text>
              </Group>
              <Text size="sm" color="dimmed">
                The current decade features unprecedented overlap of crises, innovations, and shifts. 
                This convergence hasn't happened since the 1940s.
              </Text>
            </div>
          </div>
        </Paper>
      </SimpleGrid>
      
      {/* Strategic Insights */}
      <Paper p="lg" withBorder mt="xl">
        <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
          <IconAlertTriangle size={20} style={{ marginRight: '0.5rem', color: 'var(--mantine-color-orange-6)' }} />
          Strategic Takeaways
        </Title>
        
        <SimpleGrid cols={2} spacing="md">
          <div style={{ borderLeft: '4px solid var(--mantine-color-orange-6)', paddingLeft: '1rem' }}>
            <Text weight={700}>Crisis Timing</Text>
            <Text size="sm" color="dimmed">
              Based on {insights.crisisAvgGap || "25.2"}-year cycles, another major crisis is statistically likely before 2033. 
              Contributing factors may include high debt levels, inflation, geopolitical tensions, and AI disruption.
            </Text>
          </div>
          
          <div style={{ borderLeft: '4px solid var(--mantine-color-orange-6)', paddingLeft: '1rem' }}>
            <Text weight={700}>Innovation vs. Policy</Text>
            <Text size="sm" color="dimmed">
              With innovations now occurring every {insights.innovationAvgGap || "15.2"} years, governance systems struggle to adapt quickly enough.
              This creates both opportunity and systemic risk in areas like AI, crypto, and climate technology.
            </Text>
          </div>
          
          <div style={{ borderLeft: '4px solid var(--mantine-color-orange-6)', paddingLeft: '1rem' }}>
            <Text weight={700}>Convergence Era</Text>
            <Text size="sm" color="dimmed">
              The 2020s feature simultaneous crises, innovations, and structural shifts.
              This perfect storm of change creates unprecedented volatility and opportunity.
            </Text>
          </div>
          
          <div style={{ borderLeft: '4px solid var(--mantine-color-orange-6)', paddingLeft: '1rem' }}>
            <Text weight={700}>Strategic Response</Text>
            <Text size="sm" color="dimmed">
              The optimal strategy combines multiple perspectives: macro views, legal foresight,
              technological fluency, and adaptive thinking across disciplines.
            </Text>
          </div>
        </SimpleGrid>
      </Paper>
      
      {/* Event List */}
      <Paper p="lg" withBorder mt="xl">
        <Title order={4} mb="md">Event List ({filteredEvents.length} events)</Title>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Year</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Event</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Impact</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.sort((a, b) => a.year - b.year).map((event) => (
                <React.Fragment key={event.id}>
                  <tr 
                    style={{ 
                      backgroundColor: 'var(--mantine-color-white)', 
                      borderTop: '1px solid var(--mantine-color-gray-2)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: expandedEventId === event.id ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-white)'
                    }}
                    onClick={() => toggleEventExpanded(event.id)}
                  >
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500 }}>
                      {event.year}
                    </td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      <Group spacing="xs">
                        {event.event}
                        {expandedEventId === event.id ? 
                          <IconChevronUp size={16} color="gray" /> : 
                          <IconChevronDown size={16} color="gray" />
                        }
                      </Group>
                    </td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      <Badge color={getCategoryColor(event.category)}>
                        {event.category}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--mantine-color-gray-6)' }}>
                      {event.description}
                    </td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      <Group spacing="xs" noWrap>
                        <div style={{ width: '80px', height: '8px', backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${event.impact * 10}%`, 
                              backgroundColor: `var(--mantine-color-${getCategoryColor(event.category)}-6)`,
                              borderRadius: '4px'
                            }}
                          ></div>
                        </div>
                        <Text size="xs">{event.impact}/10</Text>
                      </Group>
                    </td>
                  </tr>
                  {expandedEventId === event.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0 }}>
                        <Paper 
                          p="md" 
                          withBorder={false} 
                          style={{ 
                            margin: '0 1rem 1rem 1rem',
                            backgroundColor: 'var(--mantine-color-gray-0)',
                            borderLeft: `3px solid var(--mantine-color-${getCategoryColor(event.category)}-6)`
                          }}
                        >
                          <Group position="apart" mb="xs">
                            <Title order={4}>{event.year}: {event.event}</Title>
                            <Badge color={getCategoryColor(event.category)} size="lg">
                              {event.category}
                            </Badge>
                          </Group>
                          
                          <Text mb="md" style={{ fontStyle: 'italic' }}>{event.description}</Text>
                          
                          {event.extendedDescription && (
                            <>
                              <Title order={5} mt="md" mb="xs">Historical Context</Title>
                              <Text>{event.extendedDescription}</Text>
                            </>
                          )}
                          
                          <Group position="apart" mt="lg">
                            <Text size="sm">Impact Score: <Text weight={700} span>{event.impact}/10</Text></Text>
                            <Button 
                              variant="subtle" 
                              compact 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                              rightIcon={<IconInfoCircle size={16} />}
                            >
                              View Full Details
                            </Button>
                          </Group>
                        </Paper>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Paper>
      
      {/* Methodology Note */}
      <Text size="xs" color="dimmed" mt="md" italic>
        Note: This visualization analyzes historical events across three centuries to identify patterns in financial crises, 
        technological innovation, and policy shifts. Impact scores are subjective assessments based on historical significance.
      </Text>
    </Paper>
  );
};

// Placeholder component for the structure - will implement fully later
const CombinedView = () => {
  return (
    <Paper p="xl" withBorder>
      <Title order={3} mb="lg">Integrated Crisis Analysis</Title>
      <Text>Comprehensive view will be implemented here.</Text>
    </Paper>
  );
};

// Add the new CrisesView component
const CrisesView = () => {
  const [expandedCrisisId, setExpandedCrisisId] = useState(null);
  
  const toggleCrisisExpanded = (crisisId) => {
    setExpandedCrisisId(prev => prev === crisisId ? null : crisisId);
  };
  
  // Crisis data based on provided information
  const crisisData = [
    {
      id: 1,
      crisis: "Credit Crisis of 1772",
      startYear: 1772,
      endYear: 1773,
      duration: 1,
      region: "Global",
      deathToll: "Unknown",
      recoveryMechanism: "Bank of England stabilization",
      marketRecoveryGain: "--",
      triggers: "Collapse of London banking house after partner Alexander Fordyce's default triggered a panic. Rapid credit expansion and speculation (especially in colonial trade) unwound suddenly.",
      impact: "Widespread banking runs in England, spreading to Scotland, the Netherlands, and British America. Multiple banks failed (at least 8 in London and ~20 across Europe), causing a sharp credit crunch that even helped spark unrest preceding the American Revolution.",
      recovery: "Short-lived; crisis conditions peaked in late 1772 and subsided by 1773 as authorities stabilized markets.",
      indicator: "British financial markets avoided prolonged collapse – the panic was contained relatively quickly, and normal credit flows resumed by 1774 (major banks survived intact)."
    },
    {
      id: 2,
      crisis: "Panic of 1825",
      startYear: 1825,
      endYear: 1827,
      duration: 2,
      region: "Global",
      deathToll: "Minimal",
      recoveryMechanism: "Bank of England intervention",
      marketRecoveryGain: "--",
      triggers: "Speculative bubble in Latin American bonds and mining shares on the London Stock Exchange burst. Overextension of credit by British banks (fueled by 'South American' hype and even scams like the fictitious Poyais colony) led to instability.",
      impact: "Collapse of confidence in late 1825: British stocks plunged, and over 70 banks in England failed in December 1825 (over 100 banks ultimately collapsed). The Bank of England nearly ran out of gold and had to act as lender of last resort for the first time. Economic pain spread across Europe as British trade slumped.",
      recovery: "1826–1827 (roughly 1–2 years). Emergency infusions by the Bank of England in 1825–1826 stemmed the panic, and confidence began returning by 1826. Economic activity stabilized by 1827 after financial reforms (e.g. tighter bank regulation).",
      indicator: "British stock market and trade recovered to pre-crisis levels by the late 1820s. The Bank of England's bullion reserves were rebuilt, and by 1827 UK government bond yields had fallen back, indicating restored investor confidence (an early successful 'bailout')."
    },
    {
      id: 3,
      crisis: "Panic of 1857",
      startYear: 1857,
      endYear: 1861,
      duration: 4,
      region: "Global",
      deathToll: "Minimal",
      recoveryMechanism: "US Civil War-driven recovery",
      marketRecoveryGain: "--",
      triggers: "U.S. bank failure (Ohio Life & Trust) and falling grain prices sparked a transatlantic panic. The first crisis transmitted via telegraph, it spread rapidly worldwide. Tightening credit in Britain (Bank of England's gold reserve drain) and the loss of a major gold shipment (SS Central America sinking) worsened liquidity.",
      impact: "First worldwide economic crisis – bank runs and failures swept the United States; railroads went bankrupt; U.S. unemployment spiked. The panic hit Europe in late 1857 (British banks suspended convertibility). Global trade and industrial output contracted, though the downturn was brief.",
      recovery: "Brief financial panic (late 1857), but full recovery delayed. Markets calmed by 1858 after the Bank of England suspended tight gold rules (it even received permission to breach the Bank Charter Act). U.S. banks and economy, however, did not fully rebound until the Civil War began in 1861.",
      indicator: "Bank interest rates normalized: The Bank of England's Bank Rate, which had been hiked to ~10% amid the panic, was lowered to 8% as the crisis eased. Global trade volumes recovered by 1859, and by 1861 the U.S. stock market and bank lending had largely regained pre-crisis levels."
    },
    {
      id: 4,
      crisis: "Long Depression",
      startYear: 1873,
      endYear: 1879,
      duration: 6,
      region: "Global",
      deathToll: "Tens of thousands",
      recoveryMechanism: "Global deflation, weak output",
      marketRecoveryGain: "--",
      triggers: "Collapse of speculative railroad boom in the U.S. (failure of Jay Cooke & Co.) and a stock market crash in Vienna triggered a chain reaction. Coinage law changes (demonetization of silver) and post-war investment bubbles led to a severe credit contraction.",
      impact: "Global deflationary depression – the downturn lasted a record 65 months in the U.S. (Oct 1873–Mar 1879), with ~18,000 business failures and unemployment peaking ~8%. Europe (especially Britain) suffered persistent price deflation and economic stagnation; the period was dubbed the 'Great Depression' until the 1930s.",
      recovery: "Prolonged. The U.S. economy resumed growth after 1879, but the U.K. endured intermittent recessions and an agricultural slump until 1896. Globally, mild growth continued in real terms despite falling prices, and by the 1880s industrial output was rising again.",
      indicator: "Global output never collapsed outright during this 'depression' – world GDP actually grew slowly through the 1870s. By the mid-1880s, most major economies had regained or exceeded their pre-1873 production levels. (Stock markets remained subdued, but for example U.S. railroad stock indices recovered by the late 1870s as profitability returned.)"
    },
    {
      id: 5,
      crisis: "Baring Crisis",
      startYear: 1890,
      endYear: 1891,
      duration: 1,
      region: "Global",
      deathToll: "Minimal",
      recoveryMechanism: "Bank of England and France bailout",
      marketRecoveryGain: "--",
      triggers: "Overinvestment by Baring Brothers in Argentina (sovereign debt and land speculation) led to near-insolvency of this major London bank. When Argentina defaulted on bond payments, a crisis of confidence hit London's financial markets.",
      impact: "Global contagion threat: panic was averted by a swift Bank of England-led bailout of Barings (with help from the Bank of France). British credit markets wobbled but did not collapse – the rescue limited damage mainly to Argentina's economy (which suffered a severe recession). While fears of worldwide banking failure arose, prompt intervention kept the crisis localized.",
      recovery: "Very short. By early 1891, London markets had stabilized. Confidence in British banks was largely restored within months once Barings' obligations were guaranteed. Argentina, however, endured a longer depression through the early 1890s.",
      indicator: "British stocks and bonds quickly rebounded – the London stock market experienced only a modest dip and Consol (British government bond) yields soon returned to normal levels by 1891. The contained nature of the crisis meant global financial indicators barely faltered before reaching new highs in the mid-1890s."
    },
    {
      id: 6,
      crisis: "Panic of 1907",
      startYear: 1907,
      endYear: 1909,
      duration: 2,
      region: "Global",
      deathToll: "Minimal",
      recoveryMechanism: "JP Morgan bailout, Fed created later",
      marketRecoveryGain: "+90% in 2 years",
      triggers: "U.S. stock speculation crisis (failed attempt to corner United Copper shares) set off bank runs on trust companies in New York. Liquidity withdrew from markets, and the panic spread nationwide amid an ongoing recession.",
      impact: "First worldwide crisis of the 20th century – the NYSE fell almost 50% from its 1906 peak, and numerous banks and trusts went bankrupt. The panic hit Europe as well: London and other major centers faced credit shortages as U.S. gold exports halted. J.P. Morgan famously organized a private bailout to halt the bank runs.",
      recovery: "1908–1909. The panic was sharp but short: by late 1908 the U.S. economy was recovering. The Dow Jones had bottomed at 53 in late 1907 and regained its pre-crisis level (around 100) by mid-1909. The aftermath drove monetary reforms, leading to the Federal Reserve's creation in 1913.",
      indicator: "Stock indices rebounded strongly – the Dow rose ~90% from its 1907 low over the next two years, returning to its 1906 peak. By 1909, U.S. industrial production and global trade had largely recovered, marking a new high in economic output (surpassed only by the wartime boom later)."
    },
    {
      id: 7,
      crisis: "WWI Financial Crisis",
      startYear: 1914,
      endYear: 1915,
      duration: 1,
      region: "Global",
      deathToll: "Significant (war-related)",
      recoveryMechanism: "War-financed recovery",
      marketRecoveryGain: "--",
      triggers: "Outbreak of World War I – mass liquidation of foreign assets by European investors to fund war efforts. Fears of sovereign defaults and gold withdrawals caused global stock exchanges to shut down (New York, London, Paris all closed in July–Aug 1914).",
      impact: "Global market freeze: By Aug 1914 virtually all world stock markets were closed. Banks faced runs as depositors hoarded gold; international credit markets fragmented. The U.S., Britain, and others suspended trading and gold convertibility to prevent complete collapse. (The crisis also abruptly ended the prewar gold standard system.)",
      recovery: "Late 1914 into 1915. Governments and central banks intervened (e.g. the U.S. Treasury shipped gold and issued emergency currency). The NYSE partially reopened in Nov 1914 and fully by Dec 1914. By 1915, war-time spending ignited economic activity, effectively pulling the global economy out of the financial shock.",
      indicator: "Stock indexes quickly rebounded once trading resumed: when the NYSE reopened, pent-up demand led to a sharp rally. Though the Dow Jones initially dropped ~24% upon re-opening (adjusting to war conditions), it recovered all lost value by 1916 as war finance boomed. By 1916–17 the U.S. had supplanted London as the world's financial center, with the Dow and global GDP rising above pre-1914 levels."
    },
    {
      id: 8,
      crisis: "Great Depression",
      startYear: 1929,
      endYear: 1939,
      duration: 10,
      region: "Global",
      deathToll: "5-10 million (US)",
      recoveryMechanism: "Global deflation, war recovery",
      marketRecoveryGain: "+200% from 1932 low by 1937",
      triggers: "Wall Street Crash of October 1929 after a speculative boom in stocks, compounded by policy mistakes (tight money, protectionism). U.S. bank failures snowballed (bank runs from 1930 onward) and the international gold-standard monetary system transmitted shocks globally.",
      impact: "Worst economic disaster of the 20th century. Worldwide GDP fell ~15% from 1929 to 1932; industrial output and global trade collapsed by over 50%. Unemployment reached ~25% in the U.S. (1933) and up to 30% in Germany. Thousands of banks failed, and deflation gripped many economies until the late 1930s.",
      recovery: "~1933–1939 (partial recovery). The U.S. economy began rebounding after 1933 with New Deal policies (real GDP grew ~9% a year mid-1930s), but a 1937 relapse occurred. Many countries did not regain pre-1929 output or employment levels until the onset of WWII (1939–1940) effectively ended the Depression.",
      indicator: "Stock indices remained depressed for years: the Dow Jones plunged ~89% from its 1929 peak to 1932 low and by 1937 had only recovered to ~50% of its 1929 high. (It would not exceed 1929 levels until 1954.) World GDP started growing again by 1934, and by 1939 the U.S. economy's real output was above 1929's level – but full employment and new stock highs came only with the war-driven boom."
    },
    {
      id: 9,
      crisis: "Oil Shock & Recession",
      startYear: 1973,
      endYear: 1975,
      duration: 2,
      region: "Global",
      deathToll: "Limited",
      recoveryMechanism: "OPEC shock, stagflation",
      marketRecoveryGain: "+70% by 1976",
      triggers: "OPEC oil embargo (Oct 1973) in response to the Yom Kippur War quadrupled oil prices. This, atop the collapse of the Bretton Woods fixed exchange rate system in 1971 and rising inflation, led to stagflation – high inflation and recession combined.",
      impact: "Global stagflation crisis: Major economies experienced surging consumer prices (U.S. inflation >12% by 1974) and steep recessions. 1974 saw stock market crashes worldwide – the S&P 500 plunged ~48% in 1973–74 (worst decline since the 1930s at the time) and UK stocks fell over 70% in real terms. OECD economic growth swung from +6% in 1973 to –0.4% in 1975. Unemployment rose sharply alongside double-digit inflation (a phenomenon dubbed 'stagflation').",
      recovery: "1975–1976. Oil supplies normalized and policymakers responded with monetary easing. Most countries resumed GDP growth by 1976 as inflation temporarily cooled. The U.S. for example exited recession in March 1975; by 1976, output and employment were growing again. However, inflation remained an issue and a second oil shock hit in 1979, delaying a full return to price stability.",
      indicator: "Equity markets recovered gradually – the Dow Jones Industrial Average, having bottomed at 577 in Dec 1974, climbed back near 1,000 by 1976, nearly regaining its pre-crisis peak. Global GDP began expanding again (+5% world growth in 1976), and by the late 1970s most advanced economies' industrial production had reached new highs (albeit with high inflation)."
    },
    {
      id: 10,
      crisis: "Early 1980s Debt Crisis",
      startYear: 1981,
      endYear: 1983,
      duration: 2,
      region: "Global",
      deathToll: "Tens of thousands",
      recoveryMechanism: "Latin American defaults",
      marketRecoveryGain: "+35% in 1982-83",
      triggers: "A second oil price shock (1979) triggered renewed inflation, prompting the U.S. Federal Reserve (under Volcker) to jack up interest rates above 20%, which induced deep recessions in 1981–82. High U.S. rates caused capital flow reversals that led to Latin American debt defaults (Mexico defaulted Aug 1982) – sparking the largest sovereign debt crisis since WWII.",
      impact: "Global banking crisis and recession: Unemployment in many Western countries hit postwar highs (~10% in the U.S. in 1982). Developing nations were hardest hit – over 40 countries restructured debt, and Latin America suffered a 'lost decade' of economic stagnation. Worldwide, 1981–82 saw a sharp contraction in output (world GDP per capita declined) and numerous bank losses as major international lenders were exposed to defaulting countries.",
      recovery: "1983 onward (though Latin America's recovery stretched to late 1980s). The Fed and central banks eased rates after 1982 once inflation was broken. The U.S. economy rebounded strongly by 1983 (GDP +7.9% in 1984). Global growth picked up, and an IMF-led debt restructuring program through the 1980s gradually restored solvency for debtor nations.",
      indicator: "Financial markets surged after the crisis subsided: the U.S. stock market launched a major bull run – the Dow Jones bottomed at 776 in Aug 1982 and was up 35% by the end of 1982 (closing above 1,000). By 1983 the S&P 500 had gained ~50% from its 1982 low. Meanwhile, U.S. inflation fell from 13.5% in 1980 to ~3% by 1983, and global interest rates came down, marking a return to stability."
    },
    {
      id: 11,
      crisis: "Black Monday",
      startYear: 1987,
      endYear: 1989,
      duration: 2,
      region: "Global",
      deathToll: "Minimal",
      recoveryMechanism: "Market structure flaws",
      marketRecoveryGain: "+25% in 1 year",
      triggers: "Stock market crash on Oct 19, 1987 – driven by a mix of automated program trading, overvalued equities, and investor panic – saw the Dow Jones plunge 22.6% in one day. Other markets crashed in tandem (e.g. Hong Kong -45%, Australia -41%, UK -26% in October). No specific external shock triggered it, making the collapse largely a crisis of market psychology and structure.",
      impact: "Global equity value wipeout: Approximately $1.7 trillion in market capitalization was erased worldwide. Despite the severity (the largest one-day percentage drop in history), the macroeconomic impact was limited – there was no global recession. Central banks responded by easing policy and providing liquidity, which helped restore confidence relatively quickly.",
      recovery: "Days to months. Markets stabilized within a few days as the Fed promised liquidity ('injecting money as needed'). By September 1989, the Dow had recovered all losses from the crash – it took about two years to fully return to pre-crash levels. The U.S. economy continued growing through 1987–1988 without major interruption.",
      indicator: "Stock indices rebounded to new highs: the Dow Jones, which closed at 1,739 on Black Monday, recovered 288 points within days and by end of 1988 was about 25% higher than its post-crash low. By 1989, U.S. and global stock markets were hitting record highs again, reflecting how quickly the crash was overcome."
    },
    {
      id: 12,
      crisis: "Asian Financial Crisis",
      startYear: 1997,
      endYear: 1999,
      duration: 2,
      region: "Asia/Global",
      deathToll: "Thousands",
      recoveryMechanism: "Currency crashes, IMF bailout",
      marketRecoveryGain: "+27% by 1998",
      triggers: "Currency crisis starting in Thailand (July 1997 devaluation of the baht) after speculative capital inflows reversed. Excessive foreign debt and property bubbles in 'Asian Tiger' economies led to cascading currency collapses (Thailand, Indonesia, South Korea, etc.) and investor panic.",
      impact: "Regional depression with global jitters: Several Asian currencies lost 30–80% of their value, and GDP fell ~10-15% in the worst-hit nations in 1998. Indonesia's economy contracted over 13%, its banking system collapsed and social unrest ensued. The crisis wiped out billions in equity markets across Asia and caused worldwide volatility (e.g. the Dow fell ~7% in one day in Oct 1997 on contagion fears). The IMF organized $100+ billion in rescue packages to prevent a broader financial meltdown.",
      recovery: "Late 1998 – early 2000s. IMF austerity and reform programs helped stabilize currencies by mid-1998; most affected countries returned to growth by 1999. For instance, South Korea and Thailand saw their economies recovering in 1999 with IMF support. Global confidence was largely restored by 1998's end – though some effects lingered (Japan and Russia felt aftershocks).",
      indicator: "Global markets proved resilient: the U.S. S&P 500, after a brief 10% dip, surged to new highs by 1998, offsetting Asia's turmoil. By 1999, Asian stock markets had bottomed and begun recovering – e.g. Korea's KOSPI doubled from its 1997 low by 1999. International reserves in the crisis countries were rebuilt, and by 2000 the MSCI Asian indices had recovered substantial ground."
    },
    {
      id: 13,
      crisis: "Russia Default & LTCM",
      startYear: 1998,
      endYear: 1999,
      duration: 1,
      region: "Global",
      deathToll: "Minimal",
      recoveryMechanism: "Fed-led bailout",
      marketRecoveryGain: "+27% by 1998 end",
      triggers: "Russia's government defaulted on its debt and devalued the ruble in Aug 1998, spooking investors. The panic toppled U.S. hedge fund LTCM (highly leveraged in global bonds), threatening major bank losses. Fears of a global credit freeze prompted urgent intervention.",
      impact: "Severe market turmoil: Russia's financial system collapsed; its GDP fell ~5% in 1998 and contagion hit global markets. Western banks were exposed via LTCM and Russian bonds – the Dow Jones sank 19% in Aug-Sept 1998. A Federal Reserve–brokered $3.6 billion recapitalization of LTCM prevented an uncontrolled chain-reaction, and Fed rate cuts in fall 1998 calmed markets.",
      recovery: "Late 1998. The crisis was brief – within weeks of the LTCM bailout and interest rate cuts, global bond and stock markets began to recover. By the end of 1998, the U.S. market had regained its losses and credit spreads were tightening again. Russia's economy stabilized by 1999 with IMF aid and rising oil prices.",
      indicator: "Stock indices quickly bounced back: the S&P 500's 19% slide in late August 1998 was erased by November, and the index finished 1998 up +27%. By September 1999, the Dow was over 10,000 for the first time – a new high, reflecting complete recovery. (Russian bonds remained impaired, but global financial stress metrics returned to normal by 1999.)"
    },
    {
      id: 14,
      crisis: "Dot-Com Bubble",
      startYear: 2000,
      endYear: 2003,
      duration: 3,
      region: "Global",
      deathToll: "Tens of thousands",
      recoveryMechanism: "Tech collapse",
      marketRecoveryGain: "+100% by 2006",
      triggers: "Internet stock bubble of the late 1990s collapsed in March 2000. Overvalued 'dot-com' companies with little profit fell sharply once investor optimism evaporated. Rising interest rates in 1999–2000 and a few high-profile dot-com failures triggered a massive sell-off in tech equities.",
      impact: "Market crash and mild recession: The Nasdaq composite plunged ~78% from its peak (5048 in 2000 to ~1114 by Oct 2002), erasing trillions in market value. The S&P 500 fell 49% from 2000 to 2002, and many dot-com startups went bankrupt. The U.S. economy slipped into a mild recession in 2001 (unemployment up to ~6%). Europe and Japan also suffered stock downturns, though the broader economic hit was relatively moderate.",
      recovery: "2002–2004. Markets bottomed in 2002 and began a sustained recovery by 2003 as interest rates were cut to historic lows. U.S. GDP growth resumed in 2002; by 2004 the U.S. and EU economies were expanding steadily. However, it took years for stock indices to fully rebound – the S&P 500 regained its March 2000 peak only in 2007, and the Nasdaq not until 2015.",
      indicator: "Equities slowly recovered: By October 2006 the Dow Jones hit a new all-time high (exceeding its 2000 peak), and the S&P 500 followed suit in 2007. The Nasdaq, heavily hit, more than doubled off its 2002 low by 2006. Global GDP grew ~4% annually during 2003–2004, reaching new highs and reflecting a full recovery in output."
    },
    {
      id: 15,
      crisis: "Global Financial Crisis",
      startYear: 2007,
      endYear: 2009,
      duration: 2,
      region: "Global",
      deathToll: "Estimated 5 million",
      recoveryMechanism: "Lehman collapse, housing bubble",
      marketRecoveryGain: "+100% by 2013",
      triggers: "U.S. subprime mortgage bubble burst in 2007; complex mortgage-backed securities imploded, crippling major banks. In September 2008, Lehman Brothers collapsed, triggering a worldwide credit freeze. This contagion spread through highly leveraged financial institutions across the U.S. and Europe.",
      impact: "'Great Recession' – worst downturn since 1930s: Global GDP fell ~2.1% in 2009; the U.S. GDP shrank 4.3% and unemployment hit 10%. Dozens of banks failed or were bailed out (e.g. AIG, RBS). World trade plunged over 10%. Equity markets halved – the S&P 500 fell 57% from Oct 2007 peak to Mar 2009 trough. Housing markets in the U.S. and Europe crashed, and household wealth dropped by trillions.",
      recovery: "2009–2013. Aggressive intervention (near-zero interest rates, bank bailouts, and fiscal stimulus) halted the collapse in 2009. The U.S. economy returned to growth in Q3 2009, and most major economies bottomed out in 2009 as well. Recovery was slow – it took about four years for stock markets to reclaim pre-crisis highs (the S&P 500 in 2013), and about a decade in some countries for unemployment to fully normalize.",
      indicator: "Market indices and GDP gradually climbed back: the S&P 500, after bottoming at 676 in March 2009, regained its October 2007 peak by March 2013. Global output recovered – world GDP in 2010 grew 5.4%, eclipsing its pre-crisis level. By 2013, the Dow and S&P were routinely hitting record highs again, reflecting a healed financial system (aided by extraordinary central bank support)."
    },
    {
      id: 16,
      crisis: "Eurozone Debt Crisis",
      startYear: 2010,
      endYear: 2012,
      duration: 2,
      region: "Eurozone",
      deathToll: "Over 120,000",
      recoveryMechanism: "Sovereign debt, ECB actions",
      marketRecoveryGain: "+50% by 2014",
      triggers: "Sovereign debt crisis in the eurozone: investors doubted the solvency of Greece, Italy, Portugal, Ireland, etc., which had accumulated excessive debts (Greece revealed 12.7% GDP deficit in 2009). Lacking control of their own currency (euro), these countries faced surging bond yields and potential default.",
      impact: "Near collapse of the euro: Yields on Greek 10-year bonds jumped above 35% in 2012, and Greece, Ireland, Portugal, Cyprus required EU–IMF bailouts. Harsh austerity pushed unemployment to ~27% in Greece and Spain. The crisis led to a double-dip recession in Europe (Eurozone GDP fell in 2012) and global markets feared a euro breakup. European banks, loaded with sovereign bonds, teetered until confidence was restored by policy actions.",
      recovery: "2012–2015. The European Central Bank's intervention (pledging to do 'whatever it takes' in mid-2012) calmed investors – by late 2012, bond spreads were falling and the panic subsided. From 2013 onward, gradual recovery: troubled economies stabilized and returned to modest growth (Spain, Ireland by 2014). The acute phase was over by 2013, though Greece's issues lingered until its 2015 restructuring.",
      indicator: "Bond and stock metrics improved: by September 2012, borrowing costs for Spain and Italy had dropped sharply from crisis highs as the ECB backstop took effect. Eurozone equity markets rallied – the Euro Stoxx 50 index rose ~50% from mid-2012 to end of 2013. By 2014, Greek 10-year yields had fallen below 6% (from 35%+) and European GDP was growing again – clear signs of recovery."
    },
    {
      id: 17,
      crisis: "COVID-19 Pandemic Crash",
      startYear: 2020,
      endYear: 2021,
      duration: 1,
      region: "Global",
      deathToll: "7-20 million",
      recoveryMechanism: "Pandemic shutdowns",
      marketRecoveryGain: "+50% in 6 months",
      triggers: "Global pandemic (COVID-19) forced lockdowns starting March 2020, abruptly halting economic activity worldwide. Panic over the virus and uncertainty caused one of the fastest stock sell-offs ever (accelerated by leveraged positions).",
      impact: "Unprecedented collapse and rebound: In just five weeks, February 19–March 22, 2020, the S&P 500 plunged ~34% and global stocks lost over $25 trillion in value. GDP contracted in virtually every country – global output fell ~4.4% in 2020, the worst decline since WWII. Unemployment spiked to Depression-era levels briefly (U.S. 14.7% in April 2020). Swift and massive stimulus measures (central bank asset purchases, fiscal aid) then kick-started a recovery.",
      recovery: "April 2020 – 2021. The market crash technically 'ended' by April 7, 2020, as trillions in stimulus globally led to a rapid V-shaped rebound. Economies began reopening by Q3 2020; China even grew in 2020. By early 2021, GDP in many countries was approaching pre-pandemic levels and hiring resumed. The rollout of vaccines in 2021 reinforced recovery, though some sectors lagged.",
      indicator: "Record highs within months: The S&P 500 regained its pre-COVID peak by mid-August 2020, remarkably only ~6 months after the crash, and continued to surge – gaining over 50% from the March low by August. By end of 2020, U.S. stock indices hit all-time highs, and in 2021 global GDP growth (+6%) overshot to reach a new peak, highlighting the fastest recovery of any modern crisis."
    }
  ];
  
  return (
    <Paper p="xl" withBorder>
      <Title order={3} mb="lg" style={{ display: 'flex', alignItems: 'center' }}>
        <IconCoinBitcoin size={24} style={{ marginRight: '0.75rem' }} />
        Financial Crises Throughout History
      </Title>
      
      <Text mb="lg" color="dimmed">
        Analysis of major financial crises, their causes, impacts, and recovery patterns from 1772 to present.
      </Text>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Crisis</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Start</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>End</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Duration</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Region</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Estimated Death Toll</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Recovery Mechanism</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Market Recovery Gain (%)</th>
            </tr>
          </thead>
          <tbody>
            {crisisData.map((crisis, index) => (
              <React.Fragment key={crisis.id}>
                <tr 
                  style={{ 
                    backgroundColor: expandedCrisisId === crisis.id 
                      ? 'var(--mantine-color-gray-0)' 
                      : index % 2 === 0 
                        ? 'var(--mantine-color-white)' 
                        : 'var(--mantine-color-gray-0)', 
                    borderTop: '1px solid var(--mantine-color-gray-2)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: 'var(--mantine-color-blue-0)'
                    }
                  }}
                  onClick={() => toggleCrisisExpanded(crisis.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--mantine-color-blue-0)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedCrisisId === crisis.id 
                    ? 'var(--mantine-color-gray-0)' 
                    : index % 2 === 0 
                      ? 'var(--mantine-color-white)' 
                      : 'var(--mantine-color-gray-0)'
                  }
                >
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 600 }}>
                    <Group spacing="xs">
                      {crisis.crisis}
                      {expandedCrisisId === crisis.id ? 
                        <IconChevronUp size={16} color="gray" /> : 
                        <IconChevronDown size={16} color="gray" />
                      }
                    </Group>
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {crisis.startYear}
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {crisis.endYear}
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem', textAlign: 'center' }}>
                    {crisis.duration}
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {crisis.region}
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {crisis.deathToll}
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {crisis.recoveryMechanism}
                  </td>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {crisis.marketRecoveryGain}
                  </td>
                </tr>
                {expandedCrisisId === crisis.id && (
                  <tr>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <Paper 
                        p="md" 
                        withBorder={false} 
                        style={{ 
                          margin: '0 1rem 1rem 1rem',
                          backgroundColor: 'var(--mantine-color-gray-0)',
                          borderLeft: '3px solid var(--mantine-color-red-6)'
                        }}
                      >
                        <Title order={4} mb="md">{crisis.crisis} ({crisis.startYear}–{crisis.endYear})</Title>
                        
                        <SimpleGrid cols={2} spacing="xl" mb="md">
                          <div>
                            <Text weight={700} size="sm" mb="xs" color="dimmed">Triggers/Causes</Text>
                            <Text mb="lg">{crisis.triggers}</Text>
                            
                            <Text weight={700} size="sm" mb="xs" color="dimmed">Economic Impact</Text>
                            <Text>{crisis.impact}</Text>
                          </div>
                          
                          <div>
                            <Text weight={700} size="sm" mb="xs" color="dimmed">Recovery Period</Text>
                            <Text mb="lg">{crisis.recovery}</Text>
                            
                            <Text weight={700} size="sm" mb="xs" color="dimmed">Peak Recovery Indicator</Text>
                            <Text>{crisis.indicator}</Text>
                          </div>
                        </SimpleGrid>
                        
                        <Group position="apart" mt="lg">
                          <Badge color="red" size="lg">Financial Crisis</Badge>
                          <Button 
                            variant="light" 
                            color="blue" 
                            compact
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCrisisExpanded(crisis.id);
                            }}
                          >
                            Close Details
                          </Button>
                        </Group>
                      </Paper>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      <Text size="xs" color="dimmed" mt="md" italic>
        Note: Recovery periods and indicators reflect research from multiple historical sources. Each crisis has unique recovery patterns 
        that are often measured differently based on available economic data from the era.
      </Text>
    </Paper>
  );
};

// Add the new CenturiesView component
const CenturiesView = () => {
  // Get the crisis data from useAppContext
  const { events } = useAppContext();
  
  // Add state for selected crisis
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  
  // Add state for governance filter
  const [governanceFilter, setGovernanceFilter] = useState([]);
  
  // Get unique governance types from events
  const governanceTypes = React.useMemo(() => {
    const types = new Set();
    events.forEach(event => {
      if (event.governance) {
        types.add(event.governance);
      } else {
        types.add("Other");
      }
    });
    return Array.from(types);
  }, [events]);
  
  // Calculate statistics
  const calculateStatistics = () => {
    // Total number of crises
    const totalCrises = events.length;
    
    // Calculate average years between crises
    const sortedYears = events.map(e => e.year).sort((a, b) => a - b);
    let totalGap = 0;
    let gapCount = 0;
    
    for (let i = 1; i < sortedYears.length; i++) {
      totalGap += (sortedYears[i] - sortedYears[i-1]);
      gapCount++;
    }
    
    const avgYearsBetweenCrises = gapCount > 0 ? (totalGap / gapCount).toFixed(1) : 0;
    
    // Count crises by century
    const crisesByCentury = events.reduce((acc, event) => {
      const century = event.century || getCentury(event.year);
      acc[century] = (acc[century] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalCrises,
      avgYearsBetweenCrises,
      crisesByCentury
    };
  };
  
  // Helper function to get century from year
  const getCentury = (year) => {
    const centuryNumber = Math.floor(year / 100) + 1;
    return `${centuryNumber}th Century`;
  };
  
  // Toggle governance type in filter
  const toggleGovernanceFilter = (type) => {
    setGovernanceFilter(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  // Clear all governance filters
  const clearGovernanceFilters = () => {
    setGovernanceFilter([]);
  };
  
  // Custom CSS for scrollbars
  const scrollbarStyles = `
    .hide-scrollbar {
      scrollbar-width: thin;
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
      background-color: rgba(0,0,0,0.2);
      border-radius: 6px;
    }
  `;
  
  const statistics = calculateStatistics();
  
  return (
    <>
      <style>{scrollbarStyles}</style>
      <Paper p="xl" withBorder>
        <Title order={3} mb="lg" style={{ display: 'flex', alignItems: 'center' }}>
          <IconCalendarTime size={24} style={{ marginRight: '0.75rem' }} />
          Financial Crises Timeline
        </Title>
        
        <Text mb="lg" color="dimmed">
          Analysis of financial crises by century, showing patterns and frequency across different time periods.
        </Text>
        
        <Stack spacing="xl">
          {/* Crisis Statistics Section */}
          <SimpleGrid cols={3} spacing="xl" breakpoints={[{ maxWidth: 'md', cols: 1, spacing: 'sm' }]}>
            <Paper p="md" withBorder shadow="sm" h="100%">
              <Text size="sm" weight={500} color="dimmed">TOTAL CRISES</Text>
              <Text size="xl" weight={700}>{statistics.totalCrises}</Text>
            </Paper>
            
            <Paper p="md" withBorder shadow="sm" h="100%">
              <Text size="sm" weight={500} color="dimmed">AVG. YEARS BETWEEN CRISES</Text>
              <Text size="xl" weight={700}>{statistics.avgYearsBetweenCrises} years</Text>
            </Paper>
            
            <Paper p="md" withBorder shadow="sm" h="100%">
              <Text size="sm" weight={500} color="dimmed">CRISES BY CENTURY</Text>
              <div>
                {Object.entries(statistics.crisesByCentury).map(([century, count], index) => (
                  <div 
                    key={century} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      backgroundColor: index % 2 === 0 ? 'transparent' : '#f9f9f9',
                      margin: '0 -16px',
                      padding: '8px 16px'
                    }}
                  >
                    <Text>{century}</Text>
                    <Text weight={500} style={{ textAlign: 'right' }}>{count}</Text>
                  </div>
                ))}
              </div>
            </Paper>
          </SimpleGrid>
          
          {/* Financial Crises by Decade Chart */}
          <Paper p="md" withBorder shadow="sm">
            <Title order={4} mb="md">Financial Crises by Decade</Title>
            
            {/* Governance Filter */}
            <Box mb="md">
              <Group position="apart" mb="xs">
                <Text size="sm" weight={500}>Filter by Governance Type:</Text>
                <Button 
                  variant="subtle" 
                  size="xs" 
                  compact 
                  onClick={clearGovernanceFilters}
                  disabled={governanceFilter.length === 0}
                >
                  Clear Filters
                </Button>
              </Group>
              <Group spacing="xs">
                {governanceTypes.map(type => (
                  <Badge 
                    key={type}
                    color={getGovernanceColor(type)}
                    variant={governanceFilter.includes(type) ? "filled" : "light"}
                    style={{ 
                      cursor: 'pointer', 
                      opacity: governanceFilter.length === 0 || governanceFilter.includes(type) ? 1 : 0.5 
                    }}
                    onClick={() => toggleGovernanceFilter(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </Group>
            </Box>
            
            <div style={{ height: '300px' }}>
              <CrisesTimeline governanceFilter={governanceFilter} />
            </div>
          </Paper>
          
          {/* Selected Crisis Details Card - Only shown when a crisis is selected */}
          {selectedCrisis && (
            <Paper p="md" withBorder shadow="sm" style={{ position: 'relative', marginBottom: 0 }}>
              <Box 
                style={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10, 
                  zIndex: 10,
                  cursor: 'pointer',
                  backgroundColor: '#ff4d4f',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setSelectedCrisis(null)}
              >
                <IconX size={16} color="#ffffff" />
              </Box>
              
              <Title order={3}>{selectedCrisis.year}: {selectedCrisis.name || selectedCrisis.crisis}</Title>
              
              <SimpleGrid cols={2} spacing="md" mt="md">
                <div>
                  <Text color="dimmed" size="sm">Country</Text>
                  <Text>{selectedCrisis.country}</Text>
                </div>
                <div>
                  <Text color="dimmed" size="sm">Leader</Text>
                  <Text>{selectedCrisis.leader}</Text>
                </div>
                <div>
                  <Text color="dimmed" size="sm">Governance</Text>
                  <Text>{selectedCrisis.governance}</Text>
                </div>
                <div>
                  <Text color="dimmed" size="sm">Century</Text>
                  <Text>{selectedCrisis.century}</Text>
                </div>
              </SimpleGrid>
              
              {selectedCrisis.extendedDescription && (
                <>
                  <Text color="dimmed" size="sm" mt="md">Description</Text>
                  <Text>{selectedCrisis.extendedDescription}</Text>
                </>
              )}
            </Paper>
          )}
          
          {/* Crisis List Table */}
          <Paper p="md" withBorder shadow="sm">
            <Title order={4} mb="md">Crisis List</Title>
            <div className="hide-scrollbar" style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped highlightOnHover>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'left' }}>Year</th>
                    <th style={{ width: '25%', textAlign: 'left' }}>Crisis</th>
                    <th style={{ width: '20%', textAlign: 'left' }}>Country</th>
                    <th style={{ width: '20%', textAlign: 'left' }}>Leader</th>
                    <th style={{ width: '20%', textAlign: 'left' }}>Governance</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .sort((a, b) => a.year - b.year)
                    .map(event => (
                      <tr 
                        key={event.id} 
                        onClick={() => setSelectedCrisis(event)}
                        style={{ 
                          cursor: 'pointer', 
                          backgroundColor: selectedCrisis && selectedCrisis.id === event.id ? '#f0f7ff' : 'transparent'
                        }}
                      >
                        <td style={{ textAlign: 'left', fontWeight: 500 }}>{event.year}</td>
                        <td style={{ textAlign: 'left' }}>{event.name || event.crisis}</td>
                        <td style={{ textAlign: 'left' }}>{event.country}</td>
                        <td style={{ textAlign: 'left' }}>{event.leader}</td>
                        <td style={{ textAlign: 'left' }}>
                          <Badge 
                            color={getGovernanceColor(event.governance)}
                            variant="light"
                            style={{ 
                              padding: '2px 8px', 
                              borderRadius: '20px', 
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            {event.governance}
                          </Badge>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Paper>
        </Stack>
      </Paper>
    </>
  );
};

// Helper function to get color for governance type
const getGovernanceColor = (governance) => {
  const colorMap = {
    "Constitutional Monarchy": "blue",
    "Absolute Monarchy": "red",
    "Federal Republic": "green", 
    "Republic with Stadtholder": "grape",
    "Parliamentary Republic": "indigo",
    "Republic": "teal",
    "Democratic Republic": "cyan",
    "Communist State": "orange",
    "Democracy": "grape",
    "Authoritarian": "pink",
    "Various": "gray"
  };
  
  return colorMap[governance] || "gray";
};

export default IntegratedDashboard; 