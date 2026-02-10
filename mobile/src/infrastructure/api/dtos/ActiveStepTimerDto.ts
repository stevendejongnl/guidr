import { StepTimerDto } from './StepTimerDto'

export interface ActiveStepTimerDto extends StepTimerDto {
  guideTitle: string
  stepTitle: string
}
