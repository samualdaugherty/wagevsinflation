<template>
  <div class="app-container">
    <div class="left-panel">
      <div class="content-wrapper">
        <img src="./assets/LOGO.png" alt="Wage vs Inflation" class="logo">
        
        <p class="instructions">
          Using this page is pretty simple. Just answer a couple of questions and the
          calculator will take care of the rest.
        </p>

        <form @submit.prevent="calculateResults" class="calculator-form">
          <div class="form-group">
            <label>I started my job in</label>
            <div class="inline-inputs">
              <input 
                type="text" 
                v-model="month" 
                placeholder="month" 
                required
                list="months"
              >
              <datalist id="months">
                <option v-for="m in months" :key="m" :value="m" />
              </datalist>
              <span>of</span>
              <input 
                type="text" 
                v-model="year" 
                :placeholder="validYearRange.min + ' - ' + validYearRange.max" 
                required
              >
              <span>.</span>
            </div>
          </div>

          <div class="form-group">
            <label>When I started, my annual income was</label>
            <div class="inline-inputs">
              <input 
                type="text" 
                v-model="startingSalary"
                @input="handleStartingSalaryInput"
                placeholder="dollars" 
                required
              >
              <span>per year.</span>
            </div>
          </div>

          <div class="form-group">
            <label>Now, my income is</label>
            <div class="inline-inputs">
              <input 
                type="text" 
                v-model="currentSalary"
                @input="handleCurrentSalaryInput"
                placeholder="dollars" 
                required
              >
              <span>per year.</span>
            </div>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
          <button type="submit" class="calculate-btn" :disabled="isLoading">
            {{ isLoading ? 'Calculating...' : 'Calculate' }}
          </button>
        </form>
      </div>
    </div>

    <div class="right-panel">
      <div class="content-wrapper">
        <!-- Show About section only when results are not showing -->
        <template v-if="!showResults">
          <h2>About this project</h2>
          <div class="about-content">
            <p>
              Starting in 2022, inflation spiked dramatically, and conversations about wage
              stagnation started gaining traction in the media. Most people think of
              affordability strictly in terms of the cost of goods, but it's actually a balance
              between prices and wages. If your pay doesn't keep pace with inflation, you're
              effectively losing purchasing power every year.
            </p>
            
            <p>
              I realized that many people didn't know how to calculate their own wage
              growth or compare it to annual inflation rates. So I created this project to help
              others better understand their financial standing—and advocate for their
              quality of life.
            </p>
            
            <p>
              This calculator uses data from the official U.S. Bureau of Labor Statistics
              Consumer Price Index (CPI) Calculator to ensure accuracy. The CPI reflects
              average price changes across a broad range of goods and services. That said,
              essentials like healthcare and housing often rise faster than average inflation.
              So while this tool offers a general overview, it's meant as a starting point to
              help explain why you might feel worse off—even after getting a raise.
            </p>
            
            <p>
              Currently, this calculator is designed for U.S. users only, but many industrialized
              countries provide similar official tools. I hope this resource is helpful to you. If you
              have suggestions for improving the calculator, feel free to reach out via email.
            </p>
          </div>
        </template>

        <!-- Results Section -->
        <div v-if="showResults" class="results-section">
          <h2 class="verdict">
            The verdict: <span class="verdict-highlight">{{ getVerdict() }}</span>
          </h2>
          <p class="results-text">
            Adjusted for inflation, your starting wage was <span class="results-value">{{ adjustedStartingWage }}</span>. That means you make
          </p>
          <p class="change-amount">
            <span class="change-value">{{ changePercentage }}</span> {{ getChangeText() }}
          </p>
          <p class="results-text">
            {{ getFollowupText() }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, type Ref } from 'vue'

interface FormData {
  month: string
  year: string
  startingSalary: string
  currentSalary: string
}

interface CPIData {
  year: string
  period: string
  value: string
}

const month = ref('')
const year = ref('')
const startingSalary = ref('')
const currentSalary = ref('')
const showResults = ref(false)
const adjustedStartingWage = ref('')
const changePercentage = ref('')
const resultType = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

// Add refs for the input elements
const startingSalaryInput = ref<HTMLInputElement | null>(null)
const currentSalaryInput = ref<HTMLInputElement | null>(null)

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const currentYear = new Date().getFullYear()
const validYearRange = computed(() => {
  return {
    min: currentYear - 50,
    max: currentYear
  }
})

// Format number with commas
const formatNumber = (value: string): string => {
  // Remove any non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '')
  
  // Split into whole and decimal parts
  const [whole, decimal] = cleanValue.split('.')
  
  // Add commas to whole number part
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  // Return with decimal if it exists
  return decimal ? `${formattedWhole}.${decimal}` : formattedWhole
}

// Handle starting salary input
const handleStartingSalaryInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const cleanValue = input.value.replace(/[$€£¥]/g, '').trim()
  startingSalary.value = formatNumber(cleanValue)
}

// Handle current salary input
const handleCurrentSalaryInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const cleanValue = input.value.replace(/[$€£¥]/g, '').trim()
  currentSalary.value = formatNumber(cleanValue)
}

const validateForm = () => {
  if (!months.includes(month.value)) {
    error.value = 'Please enter a valid month (e.g., January)'
    return false
  }

  const yearNum = parseInt(year.value)
  if (isNaN(yearNum) || yearNum < validYearRange.value.min || yearNum > validYearRange.value.max) {
    error.value = `Please enter a valid year between ${validYearRange.value.min} and ${validYearRange.value.max}`
    return false
  }

  // Remove currency symbols and commas before parsing
  const startingSalaryNum = parseFloat(startingSalary.value.replace(/[$€£¥,]/g, ''))
  const currentSalaryNum = parseFloat(currentSalary.value.replace(/[$€£¥,]/g, ''))
  
  if (isNaN(startingSalaryNum) || startingSalaryNum <= 0) {
    error.value = 'Please enter a valid starting salary'
    return false
  }

  if (isNaN(currentSalaryNum) || currentSalaryNum <= 0) {
    error.value = 'Please enter a valid current salary'
    return false
  }

  return true
}

const calculateInflationAdjustment = async (startYear: number, startMonth: number, amount: number): Promise<number> => {
  try {
    const currentYear = new Date().getFullYear()
    
    console.log('Making API request...')

    const response = await fetch('/api/inflation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startYear: startYear,
        endYear: currentYear
      })
    })

    console.log('API Response Status:', response.status)

    const data = await response.json()
    console.log('API Raw Response:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, message: ${data.error || 'Unknown error'}`)
    }

    if (data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`API request failed: ${data.message || 'Unknown error'}`)
    }

    const series = data.Results?.series[0]
    if (!series || !series.data) {
      throw new Error('No CPI data found in API response')
    }

    const sortedData = series.data.sort((a: CPIData, b: CPIData) => {
      const yearDiff = parseInt(b.year) - parseInt(a.year)
      if (yearDiff !== 0) return yearDiff
      return parseInt(b.period.substring(1)) - parseInt(a.period.substring(1))
    })

    console.log('Available data points:', sortedData.map((d: CPIData) => `${d.year}-${d.period}: ${d.value}`))

    const startCPI = sortedData.find((d: CPIData) => {
      return parseInt(d.year) === startYear && 
             parseInt(d.period.substring(1)) === startMonth
    })

    const currentCPI = sortedData[0]

    console.log('Found CPI values:', {
      start: startCPI ? `${startCPI.year}-${startCPI.period}: ${startCPI.value}` : 'Not found',
      current: currentCPI ? `${currentCPI.year}-${currentCPI.period}: ${currentCPI.value}` : 'Not found'
    })

    if (!startCPI || !currentCPI) {
      throw new Error(`Could not find CPI data for ${startYear}-${startMonth} or current period`)
    }

    const inflationFactor = parseFloat(currentCPI.value) / parseFloat(startCPI.value)
    const adjustedAmount = amount * inflationFactor

    console.log('Final calculation:', {
      startCPI: startCPI.value,
      currentCPI: currentCPI.value,
      inflationFactor,
      originalAmount: amount,
      adjustedAmount
    })

    return adjustedAmount
  } catch (err: unknown) {
    console.error('Detailed error in calculateInflationAdjustment:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    })
    throw err
  }
}

const determineResultType = (percentageChange: number): string => {
  if (percentageChange <= -5) {
    return 'low'
  } else if (percentageChange >= 8) {
    return 'high'
  } else {
    return 'average'
  }
}

const scrollToResults = async () => {
  // Only scroll on mobile
  if (window.innerWidth <= 768) {
    await nextTick()
    const resultsSection = document.querySelector('.results-section')
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const calculateResults = async () => {
  error.value = null
  
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  
  try {
    // Convert month name to number
    const monthNumber = months.indexOf(month.value) + 1
    const yearNumber = parseInt(year.value)
    // Remove commas before parsing the salary values
    const startingAmount = parseFloat(startingSalary.value.replace(/,/g, ''))
    const currentAmount = parseFloat(currentSalary.value.replace(/,/g, ''))

    // Get inflation-adjusted starting salary
    const adjustedStartingAmount = await calculateInflationAdjustment(
      yearNumber,
      monthNumber,
      startingAmount
    )

    // Calculate the real percentage change
    const percentChange = ((currentAmount - adjustedStartingAmount) / adjustedStartingAmount) * 100

    // Update the display values
    adjustedStartingWage.value = formatCurrency(adjustedStartingAmount)
    changePercentage.value = Math.abs(percentChange).toFixed(1) + '%'
    resultType.value = determineResultType(percentChange)
    showResults.value = true

    // Scroll to results on mobile
    await scrollToResults()

    console.log('Calculation results:', {
      startingAmount,
      adjustedStartingAmount,
      currentAmount,
      percentChange,
      resultType: resultType.value
    })
  } catch (err) {
    error.value = 'Unable to calculate inflation adjustment. Please try again.'
    console.error('Calculation error:', err)
  } finally {
    isLoading.value = false
  }
}

const getVerdict = () => {
  switch(resultType.value) {
    case 'low':
      return 'We need to talk.'
    case 'average':
      return 'It\'s probably fine.'
    case 'high':
      return 'You\'re crushing it!'
    default:
      return ''
  }
}

const getChangeText = () => {
  // Parse the numeric values and remove currency formatting and commas
  const currentAmount = parseFloat(currentSalary.value.replace(/[^0-9.-]+/g, ''));
  // For adjustedStartingWage, we only need to remove the currency symbol since it's already formatted by formatCurrency
  const adjustedStartAmount = parseFloat(adjustedStartingWage.value.replace(/[$€£¥]/g, '').replace(/,/g, ''));
  const percentChange = ((currentAmount - adjustedStartAmount) / adjustedStartAmount) * 100;
  
  console.log('Change calculation:', {
    currentAmount,
    adjustedStartAmount,
    percentChange
  });

  switch(resultType.value) {
    case 'low':
      return 'less'
    case 'average':
      return percentChange >= 0 ? 'more' : 'less'
    case 'high':
      return 'more'
    default:
      return ''
  }
}

const getFollowupText = () => {
  switch(resultType.value) {
    case 'low':
      return 'than when you started. But don\'t worry, there are things you can do about it.'
    case 'average':
      return 'than when you started. It\'s not bad, but it could be better.'
    case 'high':
      return 'than when you started. Whatever you\'re doing, it\'s working!'
    default:
      return ''
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  padding: 0;
  max-width: 100vw;
}

body {
  font-family: 'Urbanist', sans-serif;
  font-weight: 300;
  line-height: 1.6;
  font-size: 18px;
  text-align: left;
}

.app-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff;
  text-align: left;
}

.left-panel {
  flex: 1;
  background-color: #121212;
  color: #ffffff;
  padding: 4rem;
  display: flex;
  flex-direction: column;
  border-radius: 0 76px 76px 0;
}

.right-panel {
  flex: 1;
  background-color: #ffffff;
  color: #121212;
  padding: 4rem;
  overflow-y: auto;
}

.content-wrapper {
  width: 100%;
  text-align: left;
}

.logo {
  width: 150px;
  height: auto;
  margin-bottom: 2rem;
}

.vs {
  color: #4CAF50;
  margin: 0 0.5rem;
}

.instructions {
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.calculator-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group label {
  white-space: nowrap;
}

.inline-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 200px;
}

input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #ffffff;
  color: #ffffff;
  padding: 0.5rem;
  font-size: 1rem;
  font-family: 'Urbanist', sans-serif;
  font-weight: 300;
  flex: 1;
  min-width: 0;
}

input::placeholder {
  color: #A5D6A7;
}

input[placeholder="month"] {
  width: 120px;
  flex: none;
}

input[placeholder^="1975"] {
  width: 140px;
  flex: none;
}

input[placeholder="dollars"] {
  width: 120px;
  flex: none;
}

.calculate-btn {
  background-color: #4CAF50;
  color: #ffffff;
  border: none;
  padding: 0.5rem 2rem;
  font-size: 1.25rem;
  border-radius: 24px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;
  font-family: 'Urbanist', sans-serif;
  font-weight: 900;
  display: inline-block;
  width: fit-content;
}

.calculate-btn:hover {
  background-color: #45a049;
}

h1, h2 {
  font-weight: 900;
  letter-spacing: -0.03em;
}

h2 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Results Section Styles */
.results-section {
  margin-top: 4rem;
  padding-top: 4rem;
}

.verdict {
  font-size: 3.5rem;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.verdict-highlight {
  color: #4CAF50;
  display: inline;
}

.results-text {
  font-size: 1.5rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.change-amount {
  font-size: 2rem;
  font-weight: 900;
  margin: 1rem 0;
}

.change-value {
  color: #4CAF50;
}

.results-value {
  font-weight: 700;
}

.error-message {
  color: #ff3333;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.calculate-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Desktop styles */
@media (min-width: 769px) {
  .left-panel {
    height: 100vh;
    position: sticky;
    top: 0;
    overflow-y: hidden;
    box-shadow: 51px 0px 80px 0px rgba(0, 0, 0, 0.12),
                33.056px 0px 46.852px 0px rgba(0, 0, 0, 0.09),
                19.644px 0px 25.481px 0px rgba(0, 0, 0, 0.07),
                10.2px 0px 13px 0px rgba(0, 0, 0, 0.06),
                4.156px 0px 6.519px 0px rgba(0, 0, 0, 0.05),
                0.944px 0px 3.148px 0px rgba(0, 0, 0, 0.03);
  }

  .left-panel .content-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .left-panel {
    padding: 2rem;
    border-radius: 0 0 48px 48px;
  }
  
  .right-panel {
    padding: 2rem;
  }

  .results-section {
    margin-top: 0;
    padding-top: 1rem;
  }

  .verdict {
    font-size: 2.5rem;
  }

  .form-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .inline-inputs {
    width: 100%;
    max-width: none;
  }
}

datalist {
  display: none;
}

input[list] {
  position: relative;
}
</style>
