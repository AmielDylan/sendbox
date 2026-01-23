import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Calendar } from '@/components/ui/calendar'

describe('Calendar navigation', () => {
  it('navigates to next month via navigation button', async () => {
    const user = userEvent.setup()
    const today = new Date(2026, 0, 22)

    render(
      <Calendar
        mode="single"
        today={today}
        selected={today}
        onSelect={() => {}}
      />
    )

    // Caption label is rendered with role="status"
    expect(screen.getByRole('status')).toHaveTextContent(/janvier/i)

    await user.click(screen.getByRole('button', { name: /go to the next month/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/février/i)
  })
})

