import React, { createContext, useContext, useState } from 'react';

// Create a context for our application
const AppContext = createContext();

// Create a provider component that will wrap our app
export const AppProvider = ({ children }) => {
  // Initialize events state with financial crisis data
  const [events, setEvents] = useState([
    // 18th Century
    { 
      id: 1, 
      year: 1720, 
      name: "South Sea Bubble", 
      crisis: "South Sea Bubble",
      country: "Great Britain", 
      leader: "Robert Walpole", 
      governance: "Constitutional Monarchy",
      century: "18th Century",
      extendedDescription: "The South Sea Company was granted a monopoly to trade with South America, leading to wild speculation. Share prices rose from £100 to £1,000 in months before collapsing. The crash ruined thousands, including Isaac Newton who lost £20,000. This led to the Bubble Act of 1720, Britain's first securities regulation law."
    },
    { 
      id: 2, 
      year: 1720, 
      name: "Mississippi Bubble", 
      crisis: "Mississippi Bubble",
      country: "France", 
      leader: "Regent Philippe II (for Louis XV)", 
      governance: "Absolute Monarchy",
      century: "18th Century",
      extendedDescription: "The Mississippi Company, led by John Law, was involved in speculative trading of French colonial territories. Its collapse mirrored the South Sea Bubble, causing financial distress in France and ruining many investors who had been drawn into Law's ambitious scheme to refinance France's national debt."
    },
    { 
      id: 3, 
      year: 1763, 
      name: "Amsterdam Banking Crisis", 
      crisis: "Amsterdam Banking Crisis",
      country: "Dutch Republic", 
      leader: "Pieter Steyn", 
      governance: "Republic with Stadtholder",
      century: "18th Century",
      extendedDescription: "The Amsterdam Banking Crisis of 1763 was triggered by the end of the Seven Years' War and the subsequent collapse of commodity prices. Several major Amsterdam banking houses that had overextended themselves during wartime speculation collapsed, leading to a chain reaction of failures across Europe."
    },
    { 
      id: 4, 
      year: 1772, 
      name: "Credit Crisis of 1772", 
      crisis: "Credit Crisis of 1772",
      country: "Great Britain", 
      leader: "Lord North", 
      governance: "Constitutional Monarchy",
      century: "18th Century",
      extendedDescription: "The Credit Crisis of 1772 began when the major London banking house Neal, James, Fordyce and Down collapsed due to speculative investments in East India Company stock. The panic spread to Scotland, where many banks had overextended credit to colonial American enterprises."
    },
    {
      id: 5,
      year: 1783,
      name: "French Financial Crisis",
      crisis: "French Financial Crisis",
      country: "France",
      leader: "King Louis XVI",
      governance: "Absolute Monarchy",
      century: "18th Century",
      extendedDescription: "France's involvement in the Seven Years' War and the American Revolution led to massive debt. Attempts at financial reform were met with resistance from the nobility, contributing to the conditions that sparked the French Revolution."
    },
    { 
      id: 6, 
      year: 1792, 
      name: "Panic of 1792", 
      crisis: "Panic of 1792",
      country: "United States", 
      leader: "George Washington", 
      governance: "Federal Republic",
      century: "18th Century",
      extendedDescription: "The Panic of 1792 was the first financial crisis faced by the newly formed United States. It was triggered by the speculative activities of William Duer, who attempted to corner the market on U.S. debt securities and Bank of New York stock."
    },
    {
      id: 7,
      year: 1796,
      name: "Land Speculation Crisis",
      crisis: "Land Speculation Crisis",
      country: "United States",
      leader: "President John Adams",
      governance: "Federal Republic",
      century: "18th Century",
      extendedDescription: "Speculative investments in land, particularly in the American frontier, led to a financial bubble. Its burst caused economic distress in both Britain and the United States, affecting many early American land development schemes."
    },
    
    // 19th Century
    { 
      id: 8, 
      year: 1819, 
      name: "Panic of 1819", 
      crisis: "Panic of 1819",
      country: "United States", 
      leader: "James Monroe", 
      governance: "Federal Republic",
      century: "19th Century",
      extendedDescription: "The Panic of 1819 was the first widespread economic crisis in the United States after the War of 1812. It featured widespread foreclosures, bank failures, unemployment, and a slump in agriculture and manufacturing."
    },
    { 
      id: 9, 
      year: 1837, 
      name: "Panic of 1837", 
      crisis: "Panic of 1837",
      country: "United States", 
      leader: "Martin Van Buren", 
      governance: "Federal Republic",
      century: "19th Century",
      extendedDescription: "The Panic of 1837 was one of the most severe financial crises in U.S. history, triggered by speculative lending practices, a collapsing land bubble, and President Andrew Jackson's Specie Circular, which required payment for government land in gold or silver."
    },
    { 
      id: 10, 
      year: 1857, 
      name: "Panic of 1857", 
      crisis: "Panic of 1857",
      country: "United States", 
      leader: "James Buchanan", 
      governance: "Federal Republic",
      century: "19th Century",
      extendedDescription: "The Panic of 1857 was the first global financial crisis, triggered by the failure of the Ohio Life Insurance and Trust Company and exacerbated by declining international trade, over-expansion of the domestic economy, and the dwindling gold supply caused by the California Gold Rush."
    },
    {
      id: 11,
      year: 1866,
      name: "Panic of 1866",
      crisis: "Panic of 1866",
      country: "United Kingdom",
      leader: "Queen Victoria",
      governance: "Constitutional Monarchy",
      century: "19th Century",
      extendedDescription: "The collapse of the London banking house Overend, Gurney and Company led to a financial panic. The crisis resulted in a severe credit crunch, numerous bank failures, and a significant economic downturn in the United Kingdom."
    },
    { 
      id: 12, 
      year: 1873, 
      name: "Panic of 1873", 
      crisis: "Panic of 1873",
      country: "United States", 
      leader: "Ulysses S. Grant", 
      governance: "Federal Republic",
      century: "19th Century",
      extendedDescription: "The Panic of 1873 began a depression that lasted until 1879 in some countries and 1896 in others, triggered by the collapse of the Vienna Stock Exchange, the failure of Jay Cooke & Company, and a bubble in railroad investments."
    },
    { 
      id: 13, 
      year: 1893, 
      name: "Panic of 1893", 
      crisis: "Panic of 1893",
      country: "United States", 
      leader: "Grover Cleveland", 
      governance: "Federal Republic",
      century: "19th Century",
      extendedDescription: "The Panic of 1893 was one of the worst economic crises in American history, triggered by railroad overbuilding and shaky railroad financing, which set off a series of bank failures. Compounded by the collapse of the Philadelphia and Reading Railroad."
    },
    
    // 20th Century
    { 
      id: 14, 
      year: 1907, 
      name: "Panic of 1907", 
      crisis: "Panic of 1907",
      country: "United States", 
      leader: "Theodore Roosevelt", 
      governance: "Federal Republic",
      century: "20th Century",
      extendedDescription: "The Panic of 1907, also known as the Knickerbocker Crisis, was a financial crisis triggered by a failed attempt to corner the stock of United Copper Company. When the scheme collapsed, it sparked runs on associated banks and trust companies."
    },
    { 
      id: 15, 
      year: 1929, 
      name: "Wall Street Crash of 1929", 
      crisis: "Wall Street Crash of 1929",
      country: "United States", 
      leader: "Herbert Hoover", 
      governance: "Federal Republic",
      century: "20th Century",
      extendedDescription: "The Wall Street Crash of 1929 began with the stock market crash of October 1929 and became the worst economic crisis of modern times. U.S. unemployment rose to 25%, while global trade fell by 65%. Over 9,000 banks failed, wiping out millions of depositors' savings."
    },
    {
      id: 16,
      year: 1931,
      name: "European Banking Crisis",
      crisis: "European Banking Crisis",
      country: "Germany",
      leader: "Chancellor Heinrich Brüning",
      governance: "Parliamentary Republic",
      century: "20th Century",
      extendedDescription: "A financial crisis centered in Central Europe, with the collapse of the Austrian Creditanstalt bank triggering a wave of bank failures across Europe and intensifying the Great Depression."
    },
    { 
      id: 17, 
      year: 1973, 
      name: "Oil Crisis", 
      crisis: "Oil Crisis",
      country: "Global", 
      leader: "Various", 
      governance: "Various",
      century: "20th Century",
      extendedDescription: "The 1973 Oil Crisis began when OPEC members, led by Saudi Arabia, declared an oil embargo against nations supporting Israel in the Yom Kippur War. Global oil prices quadrupled from $3 to $12 per barrel in just six months."
    },
    { 
      id: 18, 
      year: 1980, 
      name: "Volcker Shock", 
      crisis: "Volcker Shock",
      country: "United States", 
      leader: "Jimmy Carter/Ronald Reagan", 
      governance: "Federal Republic",
      century: "20th Century",
      extendedDescription: "The Volcker Shock refers to Federal Reserve Chairman Paul Volcker's decision to raise interest rates to unprecedented levels—peaking at 20% in 1981—to combat the stubborn inflation of the 1970s."
    },
    { 
      id: 19, 
      year: 1987, 
      name: "Black Monday", 
      crisis: "Black Monday",
      country: "Global", 
      leader: "Various", 
      governance: "Various",
      century: "20th Century",
      extendedDescription: "On October 19, 1987, global stock markets crashed, with the Dow Jones Industrial Average plummeting 22.6%—its largest one-day percentage drop in history. The causes included portfolio insurance, programmatic trading, overvaluation, and market psychology."
    },
    {
      id: 20,
      year: 1990,
      name: "Japanese Asset Bubble Collapse",
      crisis: "Japanese Asset Bubble Collapse",
      country: "Japan",
      leader: "Prime Minister Toshiki Kaifu",
      governance: "Parliamentary Democracy",
      century: "20th Century",
      extendedDescription: "Japan's economic bubble of soaring stock and real estate prices collapsed in 1990, leading to over two decades of economic stagnation known as the 'Lost Decades'. The Nikkei stock index lost over 60% of its value, and real estate prices fell by as much as 80% in major cities."
    },
    { 
      id: 21, 
      year: 1994, 
      name: "Bond Market Crash", 
      crisis: "Bond Market Crash",
      country: "Global", 
      leader: "Various", 
      governance: "Various",
      century: "20th Century",
      extendedDescription: "The 1994 Bond Market Crash occurred when the Federal Reserve unexpectedly began a series of interest rate hikes, causing the worst bond market decline in history at that time. As interest rates rose from 3% to 6%, bond prices collapsed."
    },
    {
      id: 22,
      year: 1997,
      name: "Asian Financial Crisis",
      crisis: "Asian Financial Crisis",
      country: "Thailand",
      leader: "Prime Minister Chavalit Yongchaiyudh",
      governance: "Constitutional Monarchy",
      century: "20th Century",
      extendedDescription: "The Asian Financial Crisis began in Thailand with the collapse of the Thai baht in July 1997 and spread throughout East Asia. Excessive foreign borrowing, fixed exchange rates, and property speculation created vulnerabilities that led to currency collapses, banking failures, and economic contraction across multiple countries."
    },
    
    // 21st Century
    { 
      id: 23, 
      year: 2000, 
      name: "Dotcom Crash", 
      crisis: "Dotcom Crash",
      country: "United States", 
      leader: "Bill Clinton", 
      governance: "Federal Republic",
      century: "21st Century",
      extendedDescription: "The Dotcom Crash of 2000-2002 marked the bursting of a massive speculative bubble in internet-related companies. From March 2000 to October 2002, the NASDAQ Composite lost 78% of its value, wiping out $5 trillion in market capitalization."
    },
    { 
      id: 24, 
      year: 2008, 
      name: "Global Financial Crisis", 
      crisis: "Global Financial Crisis",
      country: "Global", 
      leader: "Various", 
      governance: "Various",
      century: "21st Century",
      extendedDescription: "The 2008 Global Financial Crisis was triggered by the collapse of the U.S. housing market and the subsequent failure of major financial institutions heavily invested in mortgage-backed securities. Lehman Brothers' bankruptcy on September 15, 2008 marked the largest bankruptcy filing in U.S. history."
    },
    { 
      id: 25, 
      year: 2010, 
      name: "European Debt Crisis", 
      crisis: "European Debt Crisis",
      country: "European Union", 
      leader: "Various", 
      governance: "Various",
      century: "21st Century",
      extendedDescription: "The European Debt Crisis emerged when several European nations—primarily Greece, but also Ireland, Portugal, Spain, and Italy—faced unsustainable government debt levels and potential default."
    },
    { 
      id: 26, 
      year: 2020, 
      name: "COVID-19 Market Crash", 
      crisis: "COVID-19 Market Crash",
      country: "Global", 
      leader: "Various", 
      governance: "Various",
      century: "21st Century",
      extendedDescription: "The COVID-19 pandemic triggered the fastest global market crash in history. Between February 19 and March 23, 2020, the S&P 500 fell 34%. Oil futures briefly traded at negative prices for the first time ever."
    },
    { 
      id: 27, 
      year: 2023, 
      name: "Silicon Valley Bank Collapse", 
      crisis: "Silicon Valley Bank Collapse",
      country: "United States", 
      leader: "Joe Biden", 
      governance: "Federal Republic",
      century: "21st Century",
      extendedDescription: "The March 2023 collapse of Silicon Valley Bank (SVB)—the 16th largest U.S. bank and banker to nearly half of all U.S. venture-backed startups—marked the largest bank failure since the 2008 crisis."
    }
  ]);

  // Values to be provided to the context
  const contextValue = {
    events,
    setEvents
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default useAppContext; 