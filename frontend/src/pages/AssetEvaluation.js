import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Grid,
  Group,
  LoadingOverlay,
  NumberInput,
  Paper,
  Select,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash, IconEdit, IconDeviceFloppy, IconX } from '@tabler/icons-react';

// Function to generate a unique ID
const generateId = () => `evaluation-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Local storage key for evaluations
const STORAGE_KEY = 'asset-evaluations';

// Add a safe date formatting function near the top of the component
const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    } else {
      return new Date(date).toLocaleDateString();
    }
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Invalid date';
  }
};

const AssetEvaluation = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  
  // State to store saved evaluations
  const [evaluations, setEvaluations] = useState([]);
  // State to track active form (new or editing)
  const [activeFormId, setActiveFormId] = useState(null);
  // State to track if form is in edit mode
  const [isEditing, setIsEditing] = useState(false);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // State for sticky header
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  
  // Reference to the form header section
  const formHeaderRef = useRef(null);

  // Initialize form with Mantine form hook
  const form = useForm({
    initialValues: {
      token: '',
      price: '',
      amount: '',
      date: new Date(),
      rulingReason: '',
      commitment: '',
      investmentCapital: '',
      riskPercent: '',
      priceObjective1: '',
      priceObjective2: '',
      priceObjective3: '',
      timeToAchieve: 'March 2024',
      lowProjection: '',
      highProjection: '',
      priceBought: '',
      profitPrice: '',
      priceAction: [],
      cryptoMarket: [],
      marketTrend: '',
      notes: '',
      currentYearLow: '',
      currentYearHigh: '',
      currentYearPercentEarned: '',
      currentYearPriceToEarningRatio: '',
      previousYearLow: '',
      previousYearHigh: '',
      previousYearPercentEarned: '',
      previousYearPriceToEarningRatio: '',
      possibilities: '',
      yearsToDoubleEarnings: '',
      yearsToDoublePrice: '',
      futureComments: '',
      periodicChecks: [
        {
          checkDate: new Date(),
          coinPrice: '',
          marketComment: '',
          actionTaken: ''
        }
      ],
      completedTransactions: [
        {
          dateClosed: new Date(),
          periodHeld: '',
          profitLoss: '',
          reason: ''
        }
      ]
    },
    validate: {
      token: (value) => (!value ? 'Token name is required' : null),
      price: (value) => (!value ? 'Price is required' : null),
      amount: (value) => (!value ? 'Amount is required' : null),
    },
  });

  // Load saved evaluations from local storage on component mount
  useEffect(() => {
    const savedEvaluations = localStorage.getItem(STORAGE_KEY);
    if (savedEvaluations) {
      try {
        // Parse the JSON and convert date strings back to Date objects
        const parsed = JSON.parse(savedEvaluations);
        const hydratedEvals = parsed.map(item => ({
          ...item,
          date: item.date ? new Date(item.date) : new Date(),
          lastCheck: item.lastCheck ? new Date(item.lastCheck) : new Date(),
          dateCreated: item.dateCreated ? new Date(item.dateCreated) : new Date()
        }));
        setEvaluations(hydratedEvals);
      } catch (error) {
        console.error('Error loading evaluations from local storage:', error);
      }
    }
  }, []);

  // Save evaluations to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
  }, [evaluations]);

  // Handle scroll event to show/hide sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (formHeaderRef.current) {
        const headerRect = formHeaderRef.current.getBoundingClientRect();
        // If header is scrolled out of view (plus some offset), show sticky header
        setShowStickyHeader(headerRect.bottom < 10);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to generate AI summary
  const generateAISummary = (values) => {
    // In a real application, you would call an AI API here
    // For now, we'll generate a simple summary based on the input values
    
    let summaryPoints = [];
    
    // Add token and price info
    summaryPoints.push(`Investment in ${values.token} at $${values.price}`);
    
    // Add market condition
    if (values.cryptoMarket.length > 0) {
      const marketCondition = values.cryptoMarket.join(', ').toLowerCase();
      summaryPoints.push(`market is ${marketCondition}`);
    }
    
    // Add risk profile
    if (values.riskPercent) {
      summaryPoints.push(`with ${values.riskPercent}% risk allocation`);
    }
    
    // Add potential return
    if (values.highProjection) {
      summaryPoints.push(`potential upside of ${values.highProjection}%`);
    }
    
    // Add price objectives
    if (values.priceObjective3) {
      summaryPoints.push(`final price target of $${values.priceObjective3} by ${values.timeToAchieve}`);
    }
    
    // Add risk assessment
    if (values.lowProjection && values.price) {
      const riskRatio = values.lowProjection / values.price;
      if (riskRatio < 0.8) {
        summaryPoints.push('high risk profile');
      } else if (riskRatio < 0.9) {
        summaryPoints.push('moderate risk profile');
      } else {
        summaryPoints.push('conservative risk profile');
      }
    }
    
    // Add recommendation
    if (values.currentYearHigh) {
      summaryPoints.push(`consider adding more if it breaks through $${values.currentYearHigh}`);
    } else if (values.priceAction.includes('Hitting new highs')) {
      summaryPoints.push('consider adding on pullbacks');
    }
    
    // Add any recent check information
    if (values.periodicChecks && values.periodicChecks.length > 0) {
      const latestCheck = values.periodicChecks[values.periodicChecks.length - 1];
      if (latestCheck.coinPrice) {
        summaryPoints.push(`last checked price was ${latestCheck.coinPrice}`);
      }
      if (latestCheck.actionTaken) {
        summaryPoints.push(`last action taken: ${latestCheck.actionTaken}`);
      }
    }
    
    // Construct the final summary
    return summaryPoints.join(', ') + '.';
  };

  // Function to handle form submission
  const handleSubmit = async (values) => {
    setIsLoading(true);
    
    try {
      const currentDate = new Date();
      
      // Ensure dates are properly formatted for periodicChecks and completedTransactions
      const formattedValues = {
        ...values,
        periodicChecks: values.periodicChecks.map(check => ({
          ...check,
          checkDate: check.checkDate instanceof Date ? check.checkDate : new Date(check.checkDate)
        })),
        completedTransactions: values.completedTransactions.map(transaction => ({
          ...transaction,
          dateClosed: transaction.dateClosed instanceof Date ? transaction.dateClosed : new Date(transaction.dateClosed)
        }))
      };
      
      // Simulate an API call to generate summary
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate AI summary
      const aiSummary = generateAISummary(formattedValues);
      
      if (isEditing) {
        // Update existing evaluation
        setEvaluations(prev => 
          prev.map(item => 
            item.id === activeFormId 
              ? { ...formattedValues, id: activeFormId, dateCreated: item.dateCreated, summary: aiSummary } 
              : item
          )
        );
      } else {
        // Create new evaluation
        const newEvaluation = {
          ...formattedValues,
          id: generateId(),
          dateCreated: currentDate,
          summary: aiSummary,
        };
        setEvaluations(prev => [...prev, newEvaluation]);
      }
      
      // Reset form and states
      form.reset();
      setActiveFormId(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving evaluation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear the form
  const handleClear = () => {
    form.reset();
    setIsEditing(false);
    setActiveFormId(null);
  };

  // Function to delete an evaluation
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
      setEvaluations(prev => prev.filter(evaluation => evaluation.id !== id));
    }
  };

  // Function to edit an evaluation
  const handleEdit = (evaluation) => {
    // Check if there's an active editing session
    if (activeFormId && !window.confirm('You have unsaved changes. Continue?')) {
      return;
    }
    
    // Set form values from the selected evaluation
    form.setValues({
      ...evaluation
    });
    
    setActiveFormId(evaluation.id);
    setIsEditing(true);
  };

  // Add a new periodic check
  const addPeriodicCheck = () => {
    const updatedChecks = [...form.values.periodicChecks, {
      checkDate: new Date(),
      coinPrice: '',
      marketComment: '',
      actionTaken: ''
    }];
    form.setFieldValue('periodicChecks', updatedChecks);
  };

  // Add a new completed transaction
  const addCompletedTransaction = () => {
    const updatedTransactions = [...form.values.completedTransactions, {
      dateClosed: new Date(),
      periodHeld: '',
      profitLoss: '',
      reason: ''
    }];
    form.setFieldValue('completedTransactions', updatedTransactions);
  };

  return (
    <Container size="xl" py="md">
      <Flex justify="space-between" align="center" mb="md">
        <Title order={2}>Asset Evaluation Form</Title>
        <Group>
          {activeFormId && (
            <Button 
              variant="light"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={handleClear}
            >
              Cancel
            </Button>
          )}
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={() => {
              if (activeFormId && !window.confirm('Discard current changes?')) {
                return;
              }
              handleClear();
            }}
            disabled={!activeFormId && Object.values(form.values).every(val => 
              val === '' || val === null || (Array.isArray(val) && val.length === 0)
            )}
          >
            Add New Form
          </Button>
        </Group>
      </Flex>
      
      {/* Sticky Header */}
      {showStickyHeader && (
        <Paper
          p="md"
          withBorder
          shadow="sm"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: isDark ? '#1A1B1E' : 'white',
            borderRadius: 0,
            transition: 'transform 0.3s ease',
            transform: showStickyHeader ? 'translateY(0)' : 'translateY(-100%)',
          }}
        >
          <Flex justify="space-between" align="center">
            <Text weight={700} size="lg">
              {form.values.token ? `Asset: ${form.values.token}` : 'No Asset Selected'}
            </Text>
            <Group spacing="lg">
              <Text>
                {form.values.price ? `Price: $${form.values.price}` : 'Price: N/A'}
              </Text>
              <Text>
                {form.values.amount ? `Amount: ${form.values.amount}` : 'Amount: N/A'}
              </Text>
              <Text>
                {form.values.date 
                  ? `Date: ${formatDate(form.values.date)}`
                  : 'Date: N/A'}
              </Text>
              {form.values.price && form.values.amount && (
                <Text weight={700}>
                  Total: ${(parseFloat(form.values.price) * parseFloat(form.values.amount)).toFixed(2)}
                </Text>
              )}
            </Group>
          </Flex>
        </Paper>
      )}
      
      <Paper p="md" withBorder mb="lg" pos="relative">
        <LoadingOverlay visible={isLoading} overlayBlur={2} />
        <form onSubmit={form.onSubmit(handleSubmit)}>
          {/* OBJECTIVES AND RISKS SECTION */}
          <Box mb="md" ref={formHeaderRef}>
            <Title order={4} mb="sm" sx={{ 
              backgroundColor: isDark ? '#25262b' : '#e9ecef', 
              padding: '8px', 
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 600,
              color: isDark ? '#c1c2c5' : '#1A1B1E'
            }}>
              OBJECTIVES AND RISKS
            </Title>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Token"
                  placeholder="e.g., BTC, ETH, DOGE"
                  {...form.getInputProps('token')}
                  mb="md"
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Price"
                  placeholder="$1"
                  prefix="$"
                  {...form.getInputProps('price')}
                  mb="md"
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Amount"
                  placeholder="10"
                  {...form.getInputProps('amount')}
                  mb="md"
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <DateInput
                  label="Date"
                  placeholder="Select date"
                  {...form.getInputProps('date')}
                  mb="md"
                />
              </Grid.Col>
            </Grid>
            
            <TextInput
              label="Ruling reason for commitment"
              placeholder="Why are you investing in this asset?"
              {...form.getInputProps('rulingReason')}
              mb="md"
            />
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <NumberInput
                  label="Amount of commitment"
                  placeholder="$1.00"
                  prefix="$"
                  {...form.getInputProps('commitment')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <NumberInput
                  label="% of my investment capital"
                  placeholder="e.g., 5"
                  suffix="%"
                  {...form.getInputProps('investmentCapital')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <NumberInput
                  label="I will Risk"
                  placeholder="Enter Percent"
                  suffix="%"
                  {...form.getInputProps('riskPercent')}
                  mb="md"
                />
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Low Projection"
                  placeholder="e.g., $41,542"
                  prefix="$"
                  {...form.getInputProps('lowProjection')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="High Projection"
                  placeholder="e.g., $89,018"
                  prefix="$"
                  {...form.getInputProps('highProjection')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Take Price Bought"
                  placeholder="e.g., $1"
                  prefix="$"
                  {...form.getInputProps('priceBought')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Profit Price"
                  placeholder="e.g., $2"
                  prefix="$"
                  {...form.getInputProps('profitPrice')}
                  mb="md"
                />
              </Grid.Col>
            </Grid>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Price Objective 1"
                  placeholder="Est. time to achieve"
                  {...form.getInputProps('priceObjective1')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Price Objective 2"
                  placeholder="Est. time to achieve"
                  {...form.getInputProps('priceObjective2')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Price Objective 3"
                  placeholder="Est. time to achieve"
                  {...form.getInputProps('priceObjective3')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Est. time to achieve final Price Objective"
                  data={['March 2024', 'June 2024', 'September 2024', 'December 2024', 'March 2025']}
                  {...form.getInputProps('timeToAchieve')}
                  mb="md"
                />
              </Grid.Col>
            </Grid>
          </Box>
          
          {/* TECHNICAL POSITION */}
          <Box mb="md">
            <Title order={4} mb="sm" sx={{ 
              backgroundColor: isDark ? '#25262b' : '#e9ecef', 
              padding: '8px', 
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 600,
              color: isDark ? '#c1c2c5' : '#1A1B1E'
            }}>
              TECHNICAL POSITION
            </Title>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text weight={500} mb="xs">Price action coin</Text>
                <Box mb="md">
                  <Group mb={2}>
                    <Switch
                      label="Hitting new highs"
                      checked={form.values.priceAction.includes('Hitting new highs')}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue('priceAction', [...form.values.priceAction, 'Hitting new highs']);
                        } else {
                          form.setFieldValue('priceAction', form.values.priceAction.filter(item => item !== 'Hitting new highs'));
                        }
                      }}
                    />
                  </Group>
                  <Group mb={2}>
                    <Switch
                      label="Pausing in an uptrend"
                      checked={form.values.priceAction.includes('Pausing in an uptrend')}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue('priceAction', [...form.values.priceAction, 'Pausing in an uptrend']);
                        } else {
                          form.setFieldValue('priceAction', form.values.priceAction.filter(item => item !== 'Pausing in an uptrend'));
                        }
                      }}
                    />
                  </Group>
                  <Group mb={2}>
                    <Switch
                      label="Acting stronger than market/btc"
                      checked={form.values.priceAction.includes('Acting stronger than market/btc')}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue('priceAction', [...form.values.priceAction, 'Acting stronger than market/btc']);
                        } else {
                          form.setFieldValue('priceAction', form.values.priceAction.filter(item => item !== 'Acting stronger than market/btc'));
                        }
                      }}
                    />
                  </Group>
                </Box>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text weight={500} mb="xs">Crypto Market</Text>
                <Box mb="md">
                  <Group mb={2}>
                    <Switch
                      label="In a trading range"
                      checked={form.values.cryptoMarket.includes('In a trading range')}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue('cryptoMarket', [...form.values.cryptoMarket, 'In a trading range']);
                        } else {
                          form.setFieldValue('cryptoMarket', form.values.cryptoMarket.filter(item => item !== 'In a trading range'));
                        }
                      }}
                    />
                  </Group>
                  <Group mb={2}>
                    <Switch
                      label="Moving up from low ground"
                      checked={form.values.cryptoMarket.includes('Moving up from low ground')}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue('cryptoMarket', [...form.values.cryptoMarket, 'Moving up from low ground']);
                        } else {
                          form.setFieldValue('cryptoMarket', form.values.cryptoMarket.filter(item => item !== 'Moving up from low ground'));
                        }
                      }}
                    />
                  </Group>
                  <Group mb={2}>
                    <Switch
                      label="Broke a bullish falling wedge"
                      checked={form.values.cryptoMarket.includes('Broke a bullish falling wedge')}
                      onChange={(e) => {
                        if (e.currentTarget.checked) {
                          form.setFieldValue('cryptoMarket', [...form.values.cryptoMarket, 'Broke a bullish falling wedge']);
                        } else {
                          form.setFieldValue('cryptoMarket', form.values.cryptoMarket.filter(item => item !== 'Broke a bullish falling wedge'));
                        }
                      }}
                    />
                  </Group>
                </Box>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Text weight={500} mb="xs">Seasonality</Text>
                <Box mb="md">
                  <TextInput
                    placeholder="Beginning of bull; Pre Election year; Small cap season Nov - Mar"
                    {...form.getInputProps('marketTrend')}
                  />
                </Box>
                
                <Text weight={500} mb="xs" mt="md">Trend of market</Text>
                <Box mb="md">
                  <TextInput
                    placeholder="e.g., BTC low is in; Grayscale win over SEC on spot BTC ETF"
                    {...form.getInputProps('notes')}
                  />
                </Box>
              </Grid.Col>
            </Grid>
          </Box>
          
          {/* SELECTED YARDSTICKS */}
          <Box mb="md">
            <Title order={4} mb="sm" sx={{ 
              backgroundColor: isDark ? '#25262b' : '#e9ecef', 
              padding: '8px', 
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 600,
              color: isDark ? '#c1c2c5' : '#1A1B1E'
            }}>
              SELECTED YARDSTICKS
            </Title>
            
            <Text weight={600} mb="md">Current Year: Price Range</Text>
            <Grid mb="lg">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Low"
                  placeholder="e.g., 0.0156"
                  {...form.getInputProps('currentYearLow')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="High"
                  placeholder="TBD"
                  {...form.getInputProps('currentYearHigh')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Percent earned %"
                  placeholder="e.g., +3695%"
                  {...form.getInputProps('currentYearPercentEarned')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Price to Earning Ratio"
                  placeholder="If predicting from all time high..."
                  {...form.getInputProps('currentYearPriceToEarningRatio')}
                  mb="md"
                />
              </Grid.Col>
            </Grid>
            
            <Text weight={600} mb="md">Previous Year: Price Range</Text>
            <Grid mb="lg">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Low"
                  placeholder="e.g., 0.0018"
                  {...form.getInputProps('previousYearLow')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="High"
                  placeholder="e.g., 0.00714"
                  {...form.getInputProps('previousYearHigh')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Percent earned %"
                  placeholder="e.g., +3695%"
                  {...form.getInputProps('previousYearPercentEarned')}
                  mb="md"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Price to Earning Ratio"
                  placeholder="Actual or Projected"
                  {...form.getInputProps('previousYearPriceToEarningRatio')}
                  mb="md"
                />
              </Grid.Col>
            </Grid>
            
            <Text weight={600} mb="md">Possibilities</Text>
            <TextInput
              placeholder="Notes on possibilities"
              {...form.getInputProps('possibilities')}
              mb="lg"
            />
            
            <Grid mb="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="Years for earnings to double in past"
                  placeholder="e.g., 3"
                  {...form.getInputProps('yearsToDoubleEarnings')}
                  mb="md"
                />
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="Years for market price to double in past"
                  placeholder="e.g., 2"
                  {...form.getInputProps('yearsToDoublePrice')}
                  mb="md"
                />
              </Grid.Col>
            </Grid>
            
            <Text weight={600} mb="md">Comments on Future</Text>
            <TextInput
              placeholder="Comments on future outlook"
              {...form.getInputProps('futureComments')}
              mb="md"
            />
          </Box>
          
          {/* PERIODIC RE-CHECKS */}
          <Box mb="md">
            <Flex justify="space-between" align="center">
              <Title order={4} mb="sm" sx={{ 
                backgroundColor: isDark ? '#25262b' : '#e9ecef', 
                padding: '8px', 
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 600,
                color: isDark ? '#c1c2c5' : '#1A1B1E',
                flexGrow: 1
              }}>
                PERIODIC RE-CHECKS
              </Title>
              <Button 
                variant="light" 
                leftSection={<IconPlus size={16} />}
                onClick={addPeriodicCheck}
                ml="md"
              >
                Add Check
              </Button>
            </Flex>
            
            {form.values.periodicChecks.map((check, index) => (
              <Grid key={index} mb={index < form.values.periodicChecks.length - 1 ? "md" : 0}>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <DateInput
                    label="Last Check Date"
                    placeholder="Select date"
                    value={check.checkDate}
                    onChange={(value) => {
                      const updatedChecks = [...form.values.periodicChecks];
                      updatedChecks[index].checkDate = value;
                      form.setFieldValue('periodicChecks', updatedChecks);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Coin Price"
                    placeholder="Predicting .01 - .014"
                    value={check.coinPrice}
                    onChange={(event) => {
                      const updatedChecks = [...form.values.periodicChecks];
                      updatedChecks[index].coinPrice = event.currentTarget.value;
                      form.setFieldValue('periodicChecks', updatedChecks);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Comment"
                    placeholder="e.g., Total Market 3, bottomed Friday 11/13 at 3148."
                    value={check.marketComment}
                    onChange={(event) => {
                      const updatedChecks = [...form.values.periodicChecks];
                      updatedChecks[index].marketComment = event.currentTarget.value;
                      form.setFieldValue('periodicChecks', updatedChecks);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Action Taken, if any"
                    placeholder="e.g., Added more"
                    value={check.actionTaken}
                    onChange={(event) => {
                      const updatedChecks = [...form.values.periodicChecks];
                      updatedChecks[index].actionTaken = event.currentTarget.value;
                      form.setFieldValue('periodicChecks', updatedChecks);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                {index < form.values.periodicChecks.length - 1 && <Divider my="sm" />}
              </Grid>
            ))}
          </Box>
          
          {/* COMPLETED TRANSACTIONS */}
          <Box mb="md">
            <Flex justify="space-between" align="center">
              <Title order={4} mb="sm" sx={{ 
                backgroundColor: isDark ? '#25262b' : '#e9ecef', 
                padding: '8px', 
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 600,
                color: isDark ? '#c1c2c5' : '#1A1B1E',
                flexGrow: 1
              }}>
                COMPLETED TRANSACTIONS
              </Title>
              <Button 
                variant="light" 
                leftSection={<IconPlus size={16} />}
                onClick={addCompletedTransaction}
                ml="md"
              >
                Add Transaction
              </Button>
            </Flex>
            
            {form.values.completedTransactions.map((transaction, index) => (
              <Grid key={index} mb={index < form.values.completedTransactions.length - 1 ? "md" : 0}>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <DateInput
                    label="Date Closed"
                    placeholder="Select date"
                    value={transaction.dateClosed}
                    onChange={(value) => {
                      const updatedTransactions = [...form.values.completedTransactions];
                      updatedTransactions[index].dateClosed = value;
                      form.setFieldValue('completedTransactions', updatedTransactions);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Period of time held"
                    placeholder="e.g., 3 months"
                    value={transaction.periodHeld}
                    onChange={(event) => {
                      const updatedTransactions = [...form.values.completedTransactions];
                      updatedTransactions[index].periodHeld = event.currentTarget.value;
                      form.setFieldValue('completedTransactions', updatedTransactions);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Profit or Loss"
                    placeholder="e.g., +25%, -10%"
                    value={transaction.profitLoss}
                    onChange={(event) => {
                      const updatedTransactions = [...form.values.completedTransactions];
                      updatedTransactions[index].profitLoss = event.currentTarget.value;
                      form.setFieldValue('completedTransactions', updatedTransactions);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={12}>
                  <TextInput
                    label="Reason for profit or loss"
                    placeholder="Explain the reasons for the profit or loss"
                    value={transaction.reason}
                    onChange={(event) => {
                      const updatedTransactions = [...form.values.completedTransactions];
                      updatedTransactions[index].reason = event.currentTarget.value;
                      form.setFieldValue('completedTransactions', updatedTransactions);
                    }}
                    mb="md"
                  />
                </Grid.Col>
                {index < form.values.completedTransactions.length - 1 && <Divider my="sm" />}
              </Grid>
            ))}
          </Box>
          
          {/* FORM BUTTONS */}
          <Group justify="flex-end" mt="lg">
            <Button 
              leftSection={<IconX size={16} />} 
              variant="light" 
              color="red" 
              onClick={handleClear}
            >
              Clear All
            </Button>
            <Button 
              type="submit" 
              leftSection={isEditing ? <IconEdit size={16} /> : <IconDeviceFloppy size={16} />}
            >
              {isEditing ? 'Update' : 'Save'}
            </Button>
          </Group>
        </form>
      </Paper>
      
      {/* EVALUATIONS LIST */}
      {evaluations.length > 0 && (
        <Box>
          <Title order={3} mb="md">Saved Evaluations</Title>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date Created</Table.Th>
                <Table.Th>Asset</Table.Th>
                <Table.Th>Investment Total</Table.Th>
                <Table.Th>Summary</Table.Th>
                <Table.Th>Last Check</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {evaluations.map((evaluation) => {
                // Calculate investment total
                const investmentTotal = evaluation.price && evaluation.amount 
                  ? (parseFloat(evaluation.price) * parseFloat(evaluation.amount)).toFixed(2)
                  : "0.00";
                
                // Get last check date if available
                const lastCheck = evaluation.periodicChecks && evaluation.periodicChecks.length > 0
                  ? new Date(evaluation.periodicChecks[evaluation.periodicChecks.length - 1].checkDate)
                  : null;
                
                return (
                  <Table.Tr key={evaluation.id}>
                    <Table.Td>
                      {formatDate(evaluation.dateCreated)}
                    </Table.Td>
                    <Table.Td>{evaluation.token}</Table.Td>
                    <Table.Td>${investmentTotal}</Table.Td>
                    <Table.Td>{evaluation.summary}</Table.Td>
                    <Table.Td>
                      {lastCheck ? formatDate(lastCheck) : "No checks recorded"}
                    </Table.Td>
                    <Table.Td>
                      <Group>
                        <Button
                          variant="light"
                          size="xs"
                          onClick={() => handleEdit(evaluation)}
                          disabled={activeFormId !== null && activeFormId !== evaluation.id}
                        >
                          {activeFormId === evaluation.id ? 'Editing' : 'View/Edit'}
                        </Button>
                        <Button
                          variant="light"
                          color="red"
                          size="xs"
                          onClick={() => handleDelete(evaluation.id)}
                        >
                          <IconTrash size={16} />
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Container>
  );
};

export default AssetEvaluation; 