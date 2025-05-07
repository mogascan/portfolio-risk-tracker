import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Group, Text, Badge, Button, TextInput, NumberInput, Textarea, Select, Box, Paper, Title, Divider, ScrollArea, ActionIcon, Alert } from '@mantine/core';
import { IconClock, IconActivity, IconTrendingUp, IconAlertTriangle, IconFileText, IconPlus, IconX, IconInfoCircle } from '@tabler/icons-react';

// Initial event data
const initialEvents = [
  { id: 1, year: 1350, event: "Feudal Collapse", tag: "Crisis", description: "Late Medieval Agrarian Crisis", extendedDescription: "Crop failures, Black Death (~1347), massive depopulation led to labor shortages and destabilized feudal economic systems. Sparked early shifts toward wage labor and land rights." },
  { id: 2, year: 1450, event: "Fugger & Medici Banks", tag: "Shift", description: "Birth of Modern Banking", extendedDescription: "Merchant-bankers (like the Medicis in Florence) developed early banking systems, double-entry accounting, and credit. Sparked early financial centralization in Europe." },
  { id: 3, year: 1720, event: "South Sea Bubble", tag: "Crisis", description: "Speculative mania ends in collapse", extendedDescription: "The South Sea Bubble was one of history's first major financial crises. The South Sea Company, formed to trade with Spanish colonies, saw its stock price rise dramatically after taking on British government debt in exchange for trade monopolies. Wild speculation led shares to increase tenfold before collapsing virtually overnight. The aftermath led to strict legislation against creating companies without royal charter and shaped future attitudes toward financial speculation. Sir Isaac Newton, who lost a fortune in the bubble, famously remarked: 'I can calculate the motion of heavenly bodies, but not the madness of people.'" },
  { id: 4, year: 1837, event: "Panic of 1837", tag: "Crisis", description: "US banking panic, deep recession", extendedDescription: "The Panic of 1837 triggered a five-year depression in the United States, sparked by speculative lending practices, a collapsing land bubble, and President Andrew Jackson's Specie Circular (requiring payment for government land in gold/silver). The Second Bank of the United States failed to moderate the boom economy that preceded the collapse. This crisis highlighted the need for a stable banking system, eventually influencing the creation of the Federal Reserve decades later. The period saw widespread bank failures, unemployment rates of approximately 25% in some cities, and a severe contraction in economic growth that fundamentally altered American monetary policy." },
  { id: 5, year: 1873, event: "Long Depression Begins", tag: "Crisis", description: "Global deflation, rail overinvestment", extendedDescription: "The Long Depression, beginning with the Panic of 1873, was triggered by the collapse of the Vienna Stock Exchange, overextension of credit for railroad construction in the US, and the demonetization of silver. Unlike short panics, this crisis persisted for two decades, characterized by deflation, minimal economic growth, and widespread bank failures. It marked a transition from boom-bust cycles to longer-term economic dislocations, forcing economists to reconsider assumptions about market self-correction. In the United States, it led to increased pressure for monetary reform, labor unrest, and contributed to the rise of populist political movements advocating for silver coinage and inflation." },
  { id: 6, year: 1886, event: "First Gasoline Car (Benz Patent Motorwagen)", tag: "Innovation", description: "Birth of the automotive age", extendedDescription: "Karl Benz's Patent Motorwagen, the world's first purpose-built automobile with an internal combustion engine, represented more than a technological achievement—it fundamentally altered global economic structures. This innovation eventually enabled mass production techniques (notably Ford's assembly line), created entirely new industries and business models, decentralized urban populations, and reduced transportation costs across the global economy. The automobile would become central to American economic growth in the 20th century, representing up to 20% of GDP during peak periods. Its introduction began an era where technological innovation became the primary driver of economic expansion." },
  { id: 7, year: 1903, event: "Wright Brothers' First Flight", tag: "Innovation", description: "Launch of the aviation era", extendedDescription: "The Wright Brothers' achievement at Kitty Hawk fundamentally changed the nature of global markets and financial systems. Within decades, air travel compressed time and space in ways previously unimaginable, allowing for truly global marketplaces. Aviation transformed supply chains, enabled international business travel and tourism economies, and created new financial instruments to fund massive aerospace projects. The aviation industry drove materials innovation, computerization, and precision manufacturing while establishing the model for government-private sector partnerships (through military contracts and civil aviation regulations). The economic multiplier effect of aviation innovation accelerated globalization and fundamentally altered modern capitalism's scope and scale." },
  { id: 8, year: 1929, event: "Great Depression", tag: "Crisis", description: "Massive unemployment, bank failures", extendedDescription: "The Great Depression represents the most severe economic downturn in modern history, with US GDP declining by 30% between 1929-1933. The crisis emerged from speculative excesses of the 1920s, structural weaknesses in the banking system, contractionary monetary policy, and the international gold standard's limitations. Bank failures (over 9,000 banks failed) destroyed family savings, while unemployment reached 25%. The Depression fundamentally realigned American capitalism through the New Deal, establishing financial safeguards (Glass-Steagall, FDIC), labor protections, and a larger government role in economic stability. The crisis established Keynesian economics as a dominant framework and remains the benchmark against which all financial crises are measured." },
  { id: 9, year: 1930, event: "Smoot-Hawley Tariffs", tag: "Shift", description: "Protectionist trade war worsens global economy", extendedDescription: "The Smoot-Hawley Tariff Act of 1930 raised U.S. tariffs on over 20,000 imported goods to record levels, averaging 45-50%. Designed to protect American farmers and businesses, it instead sparked international retaliation, with 25 countries imposing counter-tariffs. Global trade collapsed 65% between 1929 and 1933, deepening and prolonging the Great Depression. This catastrophic policy mistake fundamentally shaped modern economic thinking about trade policy, providing the impetus for institutions like GATT and WTO, which dramatically liberalized global trade in subsequent decades. The tariffs' failure demonstrated how protectionism can transform economic downturns into prolonged systemic crises and cemented free trade as a cornerstone of post-WWII economic orthodoxy." },
  { id: 10, year: 1944, event: "Bretton Woods Agreement", tag: "Shift", description: "Creates USD-gold monetary order", extendedDescription: "The Bretton Woods Agreement established the post-WWII international monetary system, creating fixed exchange rates with the U.S. dollar as the global reserve currency (backed by gold at $35/oz). The system established the International Monetary Fund and World Bank, providing mechanisms for balance of payments support and development financing. This framework created unprecedented monetary stability during the post-war boom (1945-1971), allowing for rapid economic growth, expanded international trade, and financial globalization. Bretton Woods represented the formalization of American economic hegemony and established institutions that continue to shape global finance today, even after the system's gold-dollar link collapsed in 1971." },
  { id: 11, year: 1950, event: "Post-War Boom & Interstate Highways", tag: "Innovation", description: "Car ownership soars, suburbanization", extendedDescription: "The Federal-Aid Highway Act of 1956 authorized construction of 41,000 miles of interstate highways, representing the largest public works project in American history at that time ($500 billion in today's dollars). This massive infrastructure investment fundamentally reshaped America's economic geography by enabling suburbanization, transforming retail through shopping malls, accelerating deindustrialization of city centers, and creating entirely new logistics networks. The system reduced transportation costs by up to 40% and increased productivity throughout the economy. Combined with the post-war economic boom and cheap oil, the interstate system created the American consumer economy based on automotive mobility, home ownership, and mass consumption that defined global capitalism for decades." },
  { id: 12, year: 1969, event: "Apollo 11 Moon Landing", tag: "Innovation", description: "Peak of Cold War-era tech race", extendedDescription: "The Apollo program, costing approximately $25.4 billion ($180 billion in current dollars), represented far more than a geopolitical achievement. This moonshot created breakthrough technologies in computing, materials science, logistics, and project management that diffused throughout the economy. NASA's innovations included integrated circuits, digital flight computers, and new manufacturing techniques that accelerated semiconductor development, laying groundwork for the information economy. The Apollo program established the model for massive government-funded R&D programs with commercial spillover effects. Beyond tangible innovations, the psychological impact of seeing Earth from space shifted consciousness toward global interconnectedness and environmental awareness, influencing economic thinking in subsequent decades." },
  { id: 13, year: 1971, event: "Nixon Ends Gold Standard", tag: "Shift", description: "USD decouples from gold — fiat era begins", extendedDescription: "On August 15, 1971, President Nixon announced the U.S. would no longer convert dollars to gold at a fixed value, effectively ending the Bretton Woods system. This 'Nixon Shock' transformed the global financial architecture, creating the modern era of floating exchange rates and fiat currencies. The dollar, no longer constrained by gold reserves, could be created more freely by the Federal Reserve, fundamentally changing monetary policy. This shift enabled greater policy flexibility but also contributed to the high inflation of the 1970s. The post-gold financial system permitted unprecedented credit expansion, asset price inflation, and financial innovation while introducing new forms of instability. Every aspect of modern global finance—from forex markets to monetary policy frameworks—derives from this pivotal realignment." },
  { id: 14, year: 1973, event: "Oil Crisis", tag: "Crisis", description: "OPEC embargo shocks energy prices", extendedDescription: "The 1973 Oil Crisis erupted when OPEC nations, led by Saudi Arabia, imposed an oil embargo against countries supporting Israel in the Yom Kippur War. Oil prices quadrupled in six months, from $3 to $12 per barrel. This supply shock caused severe inflation, economic stagnation, and exposed Western economies' vulnerability to energy disruption. The crisis ended the post-war era of cheap energy that had fueled decades of growth, creating a new paradigm of energy security concerns in economic planning. It accelerated inflation (reaching 12% in the US), contributed to stock market collapse (45% drop), and forced structural economic adaptations. The aftermath included the strategic petroleum reserve, energy efficiency regulations, and permanently altered consumer behavior patterns." },
  { id: 15, year: 1980, event: "Volcker Shock", tag: "Crisis", description: "Fed rate hikes crush inflation and growth", extendedDescription: "Federal Reserve Chairman Paul Volcker's aggressive monetary tightening raised interest rates to an unprecedented 20% to combat inflation that had reached 14.8%. This 'shock therapy' triggered a severe recession, with unemployment reaching 10.8% and thousands of businesses failing. However, it successfully broke the inflationary spiral of the 1970s, restoring price stability and central bank credibility. The Volcker Shock revolutionized monetary policy, establishing inflation control as the Fed's primary objective and demonstrating central banks' willingness to impose economic pain for long-term stability. This episode transformed financial markets' relationship with the Federal Reserve and established the template for independent, inflation-targeting central banking that dominates global monetary systems today." },
  { id: 16, year: 1984, event: "Apple Macintosh Launch", tag: "Innovation", description: "User-friendly computing revolution", extendedDescription: "The Apple Macintosh introduction represented a pivotal moment in computing history, bringing graphical user interfaces and mouse-based navigation to mass-market computing. This democratization of computing extended beyond technology into economics, as it began transforming information access and worker productivity across all sectors. The Macintosh's emphasis on design, usability, and creative tools established new paradigms for human-computer interaction that would eventually reshape entire industries through digital transformation. Apple's approach—fusing technology with art and intuitive design—presaged the experience economy and demonstrated how user interface could become a competitive advantage. This launch accelerated personal computing adoption and laid foundations for the consumer technology economy." },
  { id: 17, year: 1985, event: "Microsoft Windows Launch", tag: "Innovation", description: "Mainstream adoption of personal computing", extendedDescription: "The release of Microsoft Windows marked a crucial step in making computing accessible to non-technical users and businesses. Windows fundamentally altered the economics of software by establishing a dominant platform that standardized application development. Microsoft's approach—creating an ecosystem of compatible software and hardware—established the platform model that would later define tech giants like Apple, Google, and Amazon. By bringing computing capabilities to mainstream businesses, Windows drove productivity gains estimated at 3-5% annually during the 1990s. This operating system's business importance extended beyond software, as it created network effects that transformed Microsoft into a near-monopoly and established software licensing as a dominant business model in the emerging digital economy." },
  { id: 18, year: 1987, event: "Black Monday", tag: "Crisis", description: "Stock market drops 22.6% in one day", extendedDescription: "On October 19, 1987, global stock markets crashed, with the Dow Jones plunging 22.6% in a single day—the largest one-day percentage decline in history. Unlike previous crashes, Black Monday was exacerbated by computerized program trading and portfolio insurance strategies that automatically sold futures as markets declined, creating a cascading sell-off. This event revealed how financial innovation and technology could amplify market volatility in unexpected ways. In response, the Federal Reserve under Alan Greenspan established the 'Fed put'—providing liquidity during market stress—which would define central bank intervention for decades. The crash also led to circuit breakers and trading curbs that remain core market stabilization mechanisms today. Despite its severity, the crash had limited economic impact, demonstrating the growing disconnect between financial markets and the real economy." },
  { id: 19, year: 1994, event: "Bond Market Crash", tag: "Crisis", description: "Rising rates shock debt markets", extendedDescription: "The 1994 Bond Market Crash occurred when the Federal Reserve unexpectedly raised interest rates seven times, triggering the worst bond market performance in modern history. Long-term Treasury bonds lost approximately 20% of their value, while mortgage-backed securities markets nearly froze. This crisis revealed structural vulnerabilities in the rapidly growing derivatives market, with the collapse of Orange County, California (which lost $1.7 billion through leveraged bond investments) and the bankruptcy of investment firm Askin Capital Management. The episode fundamentally changed risk management practices and transparency in fixed-income markets, accelerated the development of Value-at-Risk (VaR) models, and demonstrated how interest rate risk could cascade through seemingly unrelated markets due to leverage and complex financial instruments." },
  { id: 20, year: 1999, event: "Glass-Steagall Repeal (GLB Act)", tag: "Shift", description: "Banks re-consolidate; more systemic risk", extendedDescription: "The Gramm-Leach-Bliley Act of 1999 effectively repealed the Glass-Steagall Act of 1933, which had separated commercial and investment banking. This deregulation allowed financial conglomerates to combine commercial banking, investment banking, insurance, and securities activities under one corporate umbrella. The change accelerated financial sector consolidation, with the formation of megabanks like Citigroup and JPMorgan Chase. While proponents argued this would increase efficiency and global competitiveness, critics later pointed to this deregulation as contributing to the 2008 financial crisis by allowing banks to become both 'too big to fail' and too complex to manage effectively. The repeal marked the high point of market-oriented financial deregulation and the belief that financial markets could effectively self-regulate, a paradigm that would be severely challenged less than a decade later." },
  { id: 21, year: 2000, event: "Dotcom Crash", tag: "Crisis", description: "Tech bubble bursts", extendedDescription: "The Dotcom Crash marked the collapse of a massive speculative bubble in internet-related companies, with the NASDAQ falling 78% from peak to trough (2000-2002), erasing over $5 trillion in market value. The bubble was characterized by companies with minimal revenue receiving astronomical valuations based on metrics like 'eyeballs' rather than profits. Despite the crash's severity, it provided a necessary market correction that eliminated unsustainable business models while allowing viable technology companies to emerge stronger. The crash demonstrated the persistent human tendency toward speculative excess even in revolutionary technologies. Importantly, while the financial bubble collapsed, the underlying internet revolution continued, suggesting that financial bubbles and genuine innovation often develop in parallel but operate on different timescales, with technological transformation outlasting market corrections." },
  { id: 22, year: 2001, event: "9/11 Attacks", tag: "Shift", description: "War on Terror, global surveillance, new world order", extendedDescription: "The September 11, 2001 terrorist attacks inflicted not only human tragedy but also profound economic disruption, with estimated direct economic impact exceeding $100 billion. Financial markets closed for six days (the longest shutdown since 1933), and when they reopened, the Dow fell 7.1%. Beyond immediate impacts, 9/11 fundamentally altered risk perceptions, security spending, and global financial flows. The subsequent War on Terror has cost an estimated $8 trillion when including long-term veteran care. The attacks accelerated the security state's development, with massive new homeland security bureaucracies and surveillance systems that imposed both direct costs and efficiency frictions throughout the economy. These changes diverted significant resources from productive investment, altered global trade patterns, and established a national security premium across multiple sectors that continues to shape economic decision-making." },
  { id: 23, year: 2008, event: "Global Financial Crisis", tag: "Crisis", description: "Mortgage crisis, Lehman collapse", extendedDescription: "The 2008 Global Financial Crisis represented the most severe economic downturn since the Great Depression, triggered by the collapse of a massive housing bubble and the complex mortgage-backed securities built upon it. The crisis revealed fatal weaknesses in financial regulation, risk management, credit rating methodologies, and shadow banking. Lehman Brothers' collapse in September 2008 demonstrated that systemically important institutions could fail, triggering a global credit freeze. Unprecedented government interventions—including TARP's $700 billion bailout, Federal Reserve emergency lending of over $16 trillion, and massive monetary expansion—prevented complete financial collapse but generated lasting political backlash. The crisis permanently altered financial regulation through Dodd-Frank reforms, changed market structure through bank consolidation, and shifted monetary policy toward unconventional tools like quantitative easing that continue to shape markets today." },
  { id: 24, year: 2008, event: "Bitcoin Whitepaper", tag: "Innovation", description: "Launch of decentralized digital money", extendedDescription: "Satoshi Nakamoto's Bitcoin whitepaper, released during the 2008 financial crisis, introduced a revolutionary monetary concept: digital currency that operates without central authority. Bitcoin's innovation extends beyond technology—it represents the first successful digital scarcity system and an alternative monetary paradigm outside government control. Its blockchain architecture solved the double-spending problem that had prevented previous digital currencies from functioning. Beyond cryptocurrency, this architecture enabled trustless transactions without intermediaries, potentially disrupting financial services, supply chains, voting systems, and property rights recording. The timing of Bitcoin's release during a banking crisis was intentional, presenting an alternative to fractional reserve banking when trust in traditional institutions was collapsing. Whether Bitcoin ultimately succeeds as money, its conceptual and architectural innovations have permanently altered financial technology development." },
  { id: 25, year: 2010, event: "Eurozone Debt Crisis", tag: "Crisis", description: "Sovereign debt fears in EU periphery", extendedDescription: "The Eurozone Debt Crisis exposed fundamental flaws in the single currency's architecture. It began when Greece revealed its actual budget deficit was 15.4% of GDP (over 12.5% previously reported), triggering market panic about sovereign default. The crisis spread to Ireland, Portugal, Spain and threatened Italy, revealing how monetary union without fiscal integration created unsustainable imbalances. The crisis forced implementation of austerity measures across peripheral economies, causing deep recessions, unemployment exceeding 25% in Greece and Spain, and political instability. ECB President Mario Draghi's 2012 pledge to do 'whatever it takes' eventually stabilized markets, but only after establishing new institutions (ESM, Banking Union) and negative interest rate policies. This episode demonstrated how currency unions magnify rather than disperse risk without appropriate fiscal mechanisms and showed the political limits of financial integration." },
  { id: 26, year: 2015, event: "Tesla Model S Takes Off", tag: "Innovation", description: "Signals shift to electric mobility", extendedDescription: "Tesla's Model S represented not merely a new vehicle but a disruptive reimagining of the automobile as a software-defined, electric-powered platform. This shift threatens to redistribute value across the $3 trillion automotive industry, away from traditional mechanical engineering toward software, batteries, and user experience. Beyond transportation, Tesla's success accelerated the broader energy transition by demonstrating electric vehicles' viability and advancing battery technology that enables renewable energy storage. This innovation carries systemic financial implications, threatening to strand trillions in fossil fuel assets, reshape geopolitics by reducing oil's strategic importance, and require massive infrastructure investment. Tesla's direct-to-consumer sales model, over-the-air updates, and integration of energy generation (solar) with transportation illustrate a comprehensive reimagining of multiple industries simultaneously, with cascading effects throughout the global economy." },
  { id: 27, year: 2017, event: "Crypto Bull Run", tag: "Innovation", description: "Ethereum + altcoins surge", extendedDescription: "The 2017 cryptocurrency bull market, which saw Bitcoin reach nearly $20,000 and the total crypto market capitalization exceed $800 billion, represented the first mainstream recognition of blockchain-based digital assets. This cycle was distinguished by Ethereum's emergence as a programmable money platform enabling smart contracts and decentralized applications. The ICO (Initial Coin Offering) boom—raising over $11 billion through token sales—demonstrated both blockchain's potential to democratize capital formation and its vulnerability to speculative excess and regulatory ambiguity. Despite the subsequent 85% market correction, this cycle established cryptocurrency as a recognized, if volatile, asset class that attracted institutional attention. More importantly, it funded infrastructure development (exchanges, custody solutions, developer tools) that enabled the industry's maturation and subsequent cycles of innovation in decentralized finance, non-fungible tokens, and blockchain scalability." },
  { id: 28, year: 2020, event: "COVID Crash", tag: "Crisis", description: "Lockdowns, liquidity crunch", extendedDescription: "The COVID-19 pandemic triggered unprecedented global economic disruption, with the fastest equity market crash in history (34% decline in 23 trading days) and liquidity seizing across financial markets. The response was equally unprecedented: the Federal Reserve expanded its balance sheet by $3 trillion in three months, Congress approved multiple stimulus packages totaling over $5 trillion, and similar interventions occurred globally. These measures prevented economic collapse but dramatically expanded government debt and central bank balance sheets. The pandemic accelerated existing trends toward digitization, remote work, and e-commerce while revealing supply chain vulnerabilities and increasing economic inequality. The crisis demonstrated both modern economies' fragility to non-financial shocks and governments' willingness to employ extraordinary fiscal and monetary interventions at scales previously unimaginable, potentially redefining the relationship between states, markets, and monetary policy." },
  { id: 29, year: 2023, event: "AI Acceleration (ChatGPT)", tag: "Innovation", description: "Generative AI revolution", extendedDescription: "The release of ChatGPT in late 2022 marked a watershed moment in artificial intelligence by demonstrating that large language models could perform complex cognitive tasks with near-human capabilities. This breakthrough carries profound economic implications, potentially automating intellectual labor worth an estimated $15.7 trillion globally. Unlike previous technological revolutions focused on physical capabilities, generative AI targets knowledge work previously thought immune to automation. Economic analyses suggest AI could raise global GDP by 1.5% annually while simultaneously disrupting up to 30% of existing jobs. Beyond direct economic impacts, AI raises fundamental questions about intellectual property, data ownership, algorithmic bias, and regulatory frameworks for autonomous systems. Like previous general-purpose technologies (electricity, computing), AI's full economic impact will likely unfold over decades rather than years, potentially redefining humanity's relationship with work, knowledge creation, and economic value generation." },
  { id: 30, year: 2023, event: "SVB Collapse", tag: "Crisis", description: "Tech banking fragility exposed", extendedDescription: "Silicon Valley Bank's collapse in March 2023 represented the second-largest bank failure in U.S. history and exposed hidden vulnerabilities in the financial system created by rapid interest rate increases. SVB's failure stemmed from duration mismatches in its bond portfolio and a concentrated depositor base exceeding FDIC insurance limits. The crisis revealed how social media and digital banking could accelerate bank runs, with depositors withdrawing $42 billion in a single day—a speed impossible in previous eras. The episode necessitated extraordinary interventions, including guaranteeing all deposits regardless of size and creating a new Bank Term Funding Program offering loans against underwater bond collateral at par value. This crisis demonstrated that despite post-2008 reforms, the financial system remained vulnerable to novel risks created by monetary policy normalization after extended periods of zero interest rates, raising questions about whether regulatory frameworks can adequately address modern banking system interconnections." },
  { id: 31, year: 2023, event: "Israel-Palestine War Resurges", tag: "Shift", description: "Global attention on Middle East instability", extendedDescription: "The renewed Israel-Palestine conflict in October 2023 represents more than regional violence—it potentially signals a realignment of Middle Eastern geopolitics with significant economic implications. Beyond immediate humanitarian concerns, the conflict threatens energy security through potential disruption of shipping lanes, particularly the Strait of Hormuz through which approximately 20% of global oil flows. Market responses included oil price volatility and flight to safe-haven assets like gold and U.S. Treasuries. The conflict's timing—amid existing Russia-Ukraine tensions and U.S.-China competition—raises risks of coordinated challenges to Western-dominated financial systems. The economic consequences extend beyond energy to global trade routes, defense spending priorities, and regional investment flows. If escalation involves Iran or threatens Gulf state stability, the crisis could fundamentally alter energy market structures, accelerate dedollarization efforts, and potentially trigger stagflationary pressures through supply disruptions during already fragile economic conditions." },
  { id: 32, year: 2024, event: "BRICS, Trade Realignment", tag: "Shift", description: "De-dollarization and new alliances", extendedDescription: "The expansion of BRICS (adding Saudi Arabia, Iran, Ethiopia, Egypt, and UAE) signals an accelerating fragmentation of the global economic order. This enlarged bloc represents 45% of global population and 36% of GDP, creating an economic counterweight to G7 dominance. The group's initiatives—including alternatives to SWIFT messaging, bilateral currency arrangements bypassing the dollar, and a potential BRICS currency—represent the most serious challenge to dollar hegemony since Bretton Woods. While complete dedollarization remains unlikely near-term (given the dollar's network effects and reserve asset role), even incremental shifts could significantly impact U.S. borrowing costs, financial market stability, and monetary policy effectiveness. This realignment occurs amid broader deglobalization trends, including friend-shoring, strategic industrial policies, and retreat from multilateral institutions. The economic consequences include higher structural inflation, reduced capital efficiency, and fundamental reconfigurations of global supply chains, potentially ending the 30-year disinflationary benefit of globalization." },
  { id: 33, year: 2025, event: "YOU ARE HERE", tag: "Present", description: "Strategic thinking and survival required", extendedDescription: "The present moment represents an unprecedented convergence of transitions: from carbon to renewable energy, from globalization to fragmented trading blocs, from technological evolution to AI revolution, from traditional finance to digital assets, and from U.S. hegemony to multipolar competition. These simultaneous shifts create massive dislocations and opportunities. Capital allocation decisions today require understanding how these transitions interact—how geopolitical realignment affects energy markets, how AI deployment impacts labor markets, and how monetary policy constraints influence fiscal capacity to manage transitions. The current investment landscape features unusual temporal dislocations: we must simultaneously consider short-term economic cycles, medium-term technological disruptions, and long-term structural realignments. Unprecedented debt levels across all economic sectors, combined with demographic pressures and productivity uncertainties, create a complex environment for capital allocation. Strategic thinking must now integrate multiple interacting systems rather than linear projections based on historical patterns." }
];

// Color mapping for event tags
const tagColors = {
  Crisis: "#ff4d4f",
  Innovation: "#52c41a",
  Shift: "#1890ff",
  Present: "#fa8c16"
};

const StrategicTimelineComponent = () => {
  const [events, setEvents] = useState(initialEvents);
  const [newEvent, setNewEvent] = useState({
    event: '',
    year: new Date().getFullYear(),
    tag: 'Innovation',
    description: '',
    extendedDescription: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [filteredTag, setFilteredTag] = useState("All");
  const [insights, setInsights] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: 1700, end: 2030 });

  useEffect(() => {
    calculateInsights();
  }, [events]);

  const calculateInsights = () => {
    // Filter out ancient events (IDs 1 and 2) from statistics
    const statisticsEvents = events.filter(e => e.id !== 1 && e.id !== 2);
    
    // Count events by type
    const crisisEvents = statisticsEvents.filter(e => e.tag === "Crisis");
    const innovationEvents = statisticsEvents.filter(e => e.tag === "Innovation");
    const shiftEvents = statisticsEvents.filter(e => e.tag === "Shift");
    
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
      presentCount: statisticsEvents.filter(e => e.tag === "Present").length,
      crisisAvgGap: calculateAvgTimeBetween(crisisEvents),
      innovationAvgGap: calculateAvgTimeBetween(innovationEvents),
      shiftAvgGap: calculateAvgTimeBetween(shiftEvents)
    });
  };

  const handleAddEvent = () => {
    if (newEvent.event && newEvent.description) {
      if (isEditing && editingEventId) {
        // Update existing event
        setEvents(events.map(event => 
          event.id === editingEventId ? { ...newEvent, id: editingEventId } : event
        ));
        setIsEditing(false);
        setEditingEventId(null);
      } else {
        // Add new event
        setEvents([...events, { ...newEvent, id: events.length + 1, extendedDescription: newEvent.extendedDescription || newEvent.description }]);
      }
      setNewEvent({ year: new Date().getFullYear(), event: "", tag: "Crisis", description: "", extendedDescription: "" });
    }
  };

  const handleEditEvent = (event, e) => {
    e.stopPropagation(); // Prevent row selection
    setIsEditing(true);
    setEditingEventId(event.id);
    setNewEvent({
      year: event.year,
      event: event.event,
      tag: event.tag,
      description: event.description,
      extendedDescription: event.extendedDescription,
    });
    // Make sure we're in edit mode
    if (!editMode) {
      setEditMode(true);
    }
    // Scroll to the form
    document.querySelector('[data-add-event-form]')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRemoveEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
    if (selectedEvent && selectedEvent.id === id) {
      setSelectedEvent(null);
    }
  };

  const filteredEvents = filteredTag === "All" 
    ? events 
    : events.filter(event => event.tag === filteredTag);

  const sortedEvents = [...filteredEvents].sort((a, b) => a.year - b.year);

  // Prepare data for timeline chart
  const timelineData = [];
  const startYear = timeRange.start;
  const endYear = timeRange.end;
  
  for (let year = startYear; year <= endYear; year += 10) {
    const dataPoint = { year };
    const eventsInYear = events.filter(e => e.year >= year && e.year < year + 10);
    
    dataPoint.Crisis = eventsInYear.filter(e => e.tag === "Crisis").length;
    dataPoint.Innovation = eventsInYear.filter(e => e.tag === "Innovation").length;
    dataPoint.Shift = eventsInYear.filter(e => e.tag === "Shift").length;
    dataPoint.Present = eventsInYear.filter(e => e.tag === "Present").length;
    
    timelineData.push(dataPoint);
  }

  // Prepare scatter data for the detailed timeline
  const getScatterData = () => {
    return events.map(event => ({
      year: event.year,
      value: 1,
      tag: event.tag,
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

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column - Controls and Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Paper p="md" withBorder shadow="sm">
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
              <IconActivity size={18} style={{ marginRight: '0.5rem' }} />
              Event Filters
            </Title>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <Text component="label" size="sm" fw={500} mb={8} display="block">Filter by Type</Text>
                <Group spacing="xs">
                  <Button 
                    onClick={() => setFilteredTag("All")}
                    variant={filteredTag === "All" ? 'filled' : 'light'}
                    color={filteredTag === "All" ? 'gray' : 'gray'}
                    size="xs"
                  >
                    All
                  </Button>
                  <Button 
                    onClick={() => setFilteredTag("Crisis")}
                    variant={filteredTag === "Crisis" ? 'filled' : 'light'}
                    color="red"
                    size="xs"
                  >
                    Crisis
                  </Button>
                  <Button 
                    onClick={() => setFilteredTag("Innovation")}
                    variant={filteredTag === "Innovation" ? 'filled' : 'light'}
                    color="green"
                    size="xs"
                  >
                    Innovation
                  </Button>
                  <Button 
                    onClick={() => setFilteredTag("Shift")}
                    variant={filteredTag === "Shift" ? 'filled' : 'light'}
                    color="blue"
                    size="xs"
                  >
                    Shift
                  </Button>
                  <Button 
                    onClick={() => setFilteredTag("Present")}
                    variant={filteredTag === "Present" ? 'filled' : 'light'}
                    color="orange"
                    size="xs"
                  >
                    Present
                  </Button>
                </Group>
              </div>
              
              <div>
                <Text component="label" size="sm" fw={500} mb={8} display="block">Time Range</Text>
                <Group>
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">Start Year</Text>
                    <NumberInput 
                      value={timeRange.start}
                      onChange={(value) => setTimeRange({...timeRange, start: value})}
                      min={1700}
                      max={2100}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">End Year</Text>
                    <NumberInput 
                      value={timeRange.end}
                      onChange={(value) => setTimeRange({...timeRange, end: value})}
                      min={1700}
                      max={2100}
                    />
                  </div>
                </Group>
              </div>
            </div>
          </Paper>
          
          <Paper p="md" withBorder shadow="sm">
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
              <IconInfoCircle size={18} style={{ marginRight: '0.5rem' }} />
              Event Statistics
            </Title>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <Text size="xs" c="dimmed" fw={500}>TOTAL EVENTS BY TYPE</Text>
                <Group mt="xs" grow>
                  <Paper p="sm" bg="red.0" withBorder style={{ borderColor: 'rgba(255, 77, 79, 0.3)' }}>
                    <Text size="xs" c="red">CRISIS</Text>
                    <Text size="xl" fw={700}>{insights.crisisCount || 0}</Text>
                  </Paper>
                  <Paper p="sm" bg="green.0" withBorder style={{ borderColor: 'rgba(82, 196, 26, 0.3)' }}>
                    <Text size="xs" c="green">INNOVATION</Text>
                    <Text size="xl" fw={700}>{insights.innovationCount || 0}</Text>
                  </Paper>
                </Group>
                <Group mt="xs" grow>
                  <Paper p="sm" bg="blue.0" withBorder style={{ borderColor: 'rgba(24, 144, 255, 0.3)' }}>
                    <Text size="xs" c="blue">SHIFT</Text>
                    <Text size="xl" fw={700}>{insights.shiftCount || 0}</Text>
                  </Paper>
                  <Paper p="sm" bg="orange.0" withBorder style={{ borderColor: 'rgba(250, 140, 22, 0.3)' }}>
                    <Text size="xs" c="orange">PRESENT</Text>
                    <Text size="xl" fw={700}>{insights.presentCount || 0}</Text>
                  </Paper>
                </Group>
              </div>
              
              <div>
                <Text size="xs" c="dimmed" fw={500}>AVG YEARS BETWEEN EVENTS</Text>
                <div style={{ marginTop: '0.5rem' }}>
                  <Group position="apart" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="sm" fw={500}>Crisis</Text>
                    <Text size="sm">{insights.crisisAvgGap} years</Text>
                  </Group>
                  <Group position="apart" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size="sm" fw={500}>Innovation</Text>
                    <Text size="sm">{insights.innovationAvgGap} years</Text>
                  </Group>
                  <Group position="apart" py="xs">
                    <Text size="sm" fw={500}>Shift</Text>
                    <Text size="sm">{insights.shiftAvgGap} years</Text>
                  </Group>
                </div>
              </div>
            </div>
          </Paper>
          
          <Paper p="md" withBorder shadow="sm">
            <Group position="apart" mb="md">
              <Title order={4} style={{ display: 'flex', alignItems: 'center' }}>
                <IconPlus size={18} style={{ marginRight: '0.5rem' }} />
                {isEditing ? 'Edit Event' : 'Add New Event'}
              </Title>
              <Button 
                onClick={() => setEditMode(!editMode)}
                variant={editMode ? 'filled' : 'light'}
                color="blue"
                size="xs"
              >
                {editMode ? 'Save Mode' : 'Edit Mode'}
              </Button>
            </Group>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} data-add-event-form>
              <div>
                <Text component="label" size="sm" fw={500} mb={8} display="block">Year</Text>
                <NumberInput 
                  value={newEvent.year}
                  onChange={(value) => setNewEvent({...newEvent, year: value})}
                  min={1700}
                  max={2100}
                />
              </div>
              
              <div>
                <Text component="label" size="sm" fw={500} mb={8} display="block">Event Name</Text>
                <TextInput 
                  value={newEvent.event}
                  onChange={(e) => setNewEvent({...newEvent, event: e.target.value})}
                  placeholder="Enter event name"
                />
              </div>
              
              <div>
                <Text component="label" size="sm" fw={500} mb={8} display="block">Type</Text>
                <Select 
                  value={newEvent.tag}
                  onChange={(value) => setNewEvent({...newEvent, tag: value})}
                  data={[
                    { value: 'Crisis', label: 'Crisis' },
                    { value: 'Innovation', label: 'Innovation' },
                    { value: 'Shift', label: 'Shift' },
                    { value: 'Present', label: 'Present' }
                  ]}
                />
              </div>
              
              <div>
                <Text component="label" size="sm" fw={500} mb={8} display="block">Description</Text>
                <Textarea 
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Enter event description"
                  autosize
                  minRows={2}
                />
              </div>
              
              <div>
                <Text component="label" size="sm" fw={500} mb={8} display="block">Historical Context (optional)</Text>
                <Textarea
                  value={newEvent.extendedDescription}
                  onChange={(e) => setNewEvent({ ...newEvent, extendedDescription: e.target.value })}
                  placeholder="Enter historical context for this event"
                  autosize
                  minRows={3}
                  my="md"
                />
              </div>
              
              <Group position="right" mt="md">
                {isEditing && (
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingEventId(null);
                      setNewEvent({ year: new Date().getFullYear(), event: "", tag: "Crisis", description: "", extendedDescription: "" });
                    }}
                    color="gray"
                    variant="outline"
                    style={{ marginRight: 'auto' }}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={handleAddEvent}
                  disabled={!newEvent.event || !newEvent.description}
                  color="blue"
                  fullWidth={!isEditing}
                >
                  {isEditing ? 'Update Event' : 'Add Event'}
                </Button>
              </Group>
            </div>
          </Paper>
        </div>
        
        {/* Right Column - Data Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Timeline Visualization */}
          <Paper p="md" withBorder shadow="sm">
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
                    domain={[timeRange.start, timeRange.end]}
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
                  {events.map((event) => (
                    <Line
                      key={event.id}
                      data={[{
                        year: event.year,
                        tag: event.tag,
                        event: event.event,
                        description: event.description,
                        id: event.id
                      }]}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={false}
                    >
                      <Tooltip />
                    </Line>
                  ))}
                  {filteredEvents.filter(e => e.tag === "Crisis").map((event) => (
                    <Line 
                      key={`dot-${event.id}`}
                      type="monotone" 
                      dataKey="value" 
                      data={[{
                        year: event.year,
                        value: "Crisis",
                        tag: event.tag,
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
                  {filteredEvents.filter(e => e.tag === "Innovation").map((event) => (
                    <Line 
                      key={`dot-${event.id}`}
                      type="monotone" 
                      dataKey="value" 
                      data={[{
                        year: event.year,
                        value: "Innovation",
                        tag: event.tag,
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
                  {filteredEvents.filter(e => e.tag === "Shift").map((event) => (
                    <Line 
                      key={`dot-${event.id}`}
                      type="monotone" 
                      dataKey="value" 
                      data={[{
                        year: event.year,
                        value: "Shift",
                        tag: event.tag,
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
                  {filteredEvents.filter(e => e.tag === "Present").map((event) => (
                    <Line 
                      key={`dot-${event.id}`}
                      type="monotone" 
                      dataKey="value" 
                      data={[{
                        year: event.year,
                        value: "Present",
                        tag: event.tag,
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
            <Paper p="md" withBorder shadow="sm" data-selected-event-card>
              <Group position="apart" align="flex-start">
                <div>
                  <Group spacing="xs">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: tagColors[selectedEvent.tag] }}></div>
                    <Text size="sm" fw={500} c="dimmed">{selectedEvent.tag}</Text>
                  </Group>
                  <Title order={4} mt="xs">{selectedEvent.year}: {selectedEvent.event}</Title>
                </div>
                {editMode && (
                  <ActionIcon 
                    onClick={() => handleRemoveEvent(selectedEvent.id)}
                    color="red"
                    variant="subtle"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                )}
              </Group>
              <Text mt="md">{selectedEvent.description}</Text>
              
              {selectedEvent.extendedDescription && (
                <>
                  <Title order={5} mt="xl" mb="xs">Historical Context</Title>
                  <Text>{selectedEvent.extendedDescription}</Text>
                </>
              )}
            </Paper>
          )}
          
          {/* Event List Table */}
          <Paper p="md" withBorder shadow="sm">
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
              <IconFileText size={18} style={{ marginRight: '0.5rem' }} />
              Event Timeline
            </Title>
            
            <ScrollArea h={350}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Year</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Event</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Description</th>
                    {editMode && (
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-gray-6)', textTransform: 'uppercase' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((event) => (
                    <tr 
                      key={event.id} 
                      style={{ 
                        backgroundColor: selectedEvent && selectedEvent.id === event.id ? 'var(--mantine-color-blue-0)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <td style={{ padding: '0.75rem', borderTop: '1px solid var(--mantine-color-gray-3)', fontSize: '0.875rem', fontWeight: 500 }}>
                        {event.year}
                      </td>
                      <td style={{ padding: '0.75rem', borderTop: '1px solid var(--mantine-color-gray-3)', fontSize: '0.875rem' }}>
                        {event.event}
                      </td>
                      <td style={{ padding: '0.75rem', borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                        <Badge
                          color={event.tag === 'Crisis' ? 'red' : event.tag === 'Innovation' ? 'green' : event.tag === 'Shift' ? 'blue' : 'orange'}
                          size="sm"
                          variant="light"
                        >
                          {event.tag}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem', borderTop: '1px solid var(--mantine-color-gray-3)', fontSize: '0.875rem', color: 'var(--mantine-color-gray-6)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.description}
                      </td>
                      {editMode && (
                        <td style={{ padding: '0.75rem', borderTop: '1px solid var(--mantine-color-gray-3)', textAlign: 'right', fontSize: '0.875rem', fontWeight: 500 }}>
                          <Group spacing="xs" position="right">
                            <Button
                              onClick={(e) => handleEditEvent(event, e)}
                              variant="subtle"
                              color="blue"
                              size="xs"
                              compact
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEvent(event.id);
                              }}
                              variant="subtle"
                              color="red"
                              size="xs"
                              compact
                            >
                              Remove
                            </Button>
                          </Group>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </Paper>
          
          {/* Strategic Insights */}
          <Paper p="md" withBorder shadow="sm">
            <Title order={4} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
              <IconTrendingUp size={18} style={{ marginRight: '0.5rem' }} />
              Strategic Insights
            </Title>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <Text fw={700} c="red" style={{ display: 'flex', alignItems: 'center' }}>
                  <IconAlertTriangle size={16} style={{ marginRight: '0.5rem' }} />
                  Crises are Less Frequent, But More Destructive
                </Text>
                <Text size="sm" mt="xs">
                  On average, a major crisis hits roughly every {insights.crisisAvgGap} years — but their impact lingers for decades. 
                  From the South Sea Bubble to COVID, these events represent fragile points in global financial architecture. 
                  While less frequent, they are devastating enough to cause massive wealth transfer, unemployment, and sociopolitical upheaval.
                </Text>
              </div>
              
              <div>
                <Text fw={700} c="green" style={{ display: 'flex', alignItems: 'center' }}>
                  <IconActivity size={16} style={{ marginRight: '0.5rem' }} />
                  Innovation is Accelerating
                </Text>
                <Text size="sm" mt="xs">
                  Once happening roughly every 20–30 years, innovation now occurs every {insights.innovationAvgGap} years — with 
                  multiple overlapping breakthroughs in the 2020s (AI, EVs, crypto). This implies we are entering a phase of 
                  compounding technological disruption. Innovation may not wait for crises anymore. It's running parallel — 
                  faster, more decentralized, and with greater global reach.
                </Text>
              </div>
              
              <div>
                <Text fw={700} c="blue" style={{ display: 'flex', alignItems: 'center' }}>
                  <IconClock size={16} style={{ marginRight: '0.5rem' }} />
                  Shifts Reflect Structural Realignment
                </Text>
                <Text size="sm" mt="xs">
                  Policy and monetary shifts occur almost as frequently as innovation (every {insights.shiftAvgGap} years). These are often 
                  responses to crisis or innovation — e.g., Nixon ending the gold standard after stagflation, BRICS rising 
                  amidst de-dollarization pressure. They reflect adaptation, not failure — but carry long-term consequences 
                  like inflation, protectionism, and geopolitical tension.
                </Text>
              </div>
              
              <Alert title="Strategic Takeaways" color="gray">
                <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <Text span fw={700}>A Crisis Is Likely Within the Next Decade</Text>
                    <Text size="sm"> — We are nearly due (statistically) for another major crisis. 
                    It may already be forming (debt, inflation, geopolitical flare-ups, AI disruption, deglobalization).</Text>
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <Text span fw={700}>Innovation Will Keep Outpacing Policy</Text>
                    <Text size="sm"> — Governments and institutions may struggle to regulate or adapt 
                    fast enough to innovation (e.g. AI, crypto, autonomous weapons). This creates opportunity and risk.</Text>
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <Text span fw={700}>We Are in a Convergence Zone (2020s–2030s)</Text>
                    <Text size="sm"> — This decade is packed with simultaneous crises, innovations, 
                    and structural shifts. That hasn't happened since the 1940s (WWII, Bretton Woods, nuclear weapons, industrial labor shift).</Text>
                  </li>
                  <li>
                    <Text span fw={700}>The Smartest Strategy Is Collective, Adaptable Thinking</Text>
                    <Text size="sm"> — No single perspective will suffice. 
                    Your group's mission — combining macro views, legal foresight, tech fluency, and trading discipline — is 
                    exactly the right response to an age of overlapping turbulence.</Text>
                  </li>
                </ol>
              </Alert>
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default StrategicTimelineComponent; 