import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { temperature, humidity, windSpeed, riskFactors } = body

    // Simple risk calculation logic (you can make this more sophisticated)
    let riskScore = 0

    // Temperature contribution (higher temp = higher risk)
    riskScore += (temperature / 50) * 30 // max 30 points

    // Humidity contribution (lower humidity = higher risk)
    riskScore += ((100 - humidity) / 100) * 30 // max 30 points

    // Wind speed contribution
    riskScore += (windSpeed / 100) * 20 // max 20 points

    // Risk factors contribution (5 points each)
    riskScore += riskFactors.length * 5 // max 20 points

    // Normalize to 0-100
    riskScore = Math.min(Math.round(riskScore), 100)

    return NextResponse.json({
      riskScore,
      riskLevel: riskScore < 33 ? 'Low' : riskScore < 66 ? 'Medium' : 'High',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error processing risk assessment:', error)
    return NextResponse.json(
      { error: 'Failed to process risk assessment' },
      { status: 500 }
    )
  }
} 