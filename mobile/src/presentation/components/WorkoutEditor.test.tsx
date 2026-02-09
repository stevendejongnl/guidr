import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { WorkoutEditor } from './WorkoutEditor'
import type { TargetMuscle, Equipment } from './WorkoutEditor'

describe('WorkoutEditor', () => {
  const mockOnChangeMuscles = jest.fn()
  const mockOnChangeEquipment = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    expect(getByTestId('workout')).toBeTruthy()
    expect(getByTestId('workout:muscle-name-input')).toBeTruthy()
    expect(getByTestId('workout:add-muscle-button')).toBeTruthy()
    expect(getByTestId('workout:equipment-name-input')).toBeTruthy()
    expect(getByTestId('workout:equipment-weight-input')).toBeTruthy()
    expect(getByTestId('workout:add-equipment-button')).toBeTruthy()
  })

  it('renders existing muscles and equipment', () => {
    const muscles: TargetMuscle[] = [
      { name: 'chest', focus: 'primary' },
      { name: 'triceps', focus: 'secondary' },
    ]
    const equip: Equipment[] = [
      { name: 'dumbbells', weight: '15kg' },
    ]

    const { getByText } = render(
      <WorkoutEditor
        targetMuscles={muscles}
        equipment={equip}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    expect(getByText('chest (primary)')).toBeTruthy()
    expect(getByText('triceps (secondary)')).toBeTruthy()
    expect(getByText('dumbbells — 15kg')).toBeTruthy()
  })

  it('adds muscle with name and focus', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.changeText(getByTestId('workout:muscle-name-input'), 'chest')
    fireEvent.press(getByTestId('workout:add-muscle-button'))

    expect(mockOnChangeMuscles).toHaveBeenCalledWith([
      { name: 'chest', focus: 'primary' },
    ])
  })

  it('adds equipment with name and weight', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.changeText(getByTestId('workout:equipment-name-input'), 'dumbbells')
    fireEvent.changeText(getByTestId('workout:equipment-weight-input'), '15kg')
    fireEvent.press(getByTestId('workout:add-equipment-button'))

    expect(mockOnChangeEquipment).toHaveBeenCalledWith([
      { name: 'dumbbells', weight: '15kg' },
    ])
  })

  it('does not add muscle when name is empty', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.press(getByTestId('workout:add-muscle-button'))

    expect(mockOnChangeMuscles).not.toHaveBeenCalled()
  })

  it('does not add equipment when name is empty', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.press(getByTestId('workout:add-equipment-button'))

    expect(mockOnChangeEquipment).not.toHaveBeenCalled()
  })

  it('removes muscle by index', () => {
    const muscles: TargetMuscle[] = [
      { name: 'chest', focus: 'primary' },
      { name: 'back', focus: 'secondary' },
    ]

    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={muscles}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.press(getByTestId('workout:remove-muscle-0'))

    expect(mockOnChangeMuscles).toHaveBeenCalledWith([
      { name: 'back', focus: 'secondary' },
    ])
  })

  it('removes equipment by index', () => {
    const equip: Equipment[] = [
      { name: 'dumbbells', weight: '15kg' },
      { name: 'barbell', weight: '20kg' },
    ]

    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={equip}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.press(getByTestId('workout:remove-equipment-0'))

    expect(mockOnChangeEquipment).toHaveBeenCalledWith([
      { name: 'barbell', weight: '20kg' },
    ])
  })

  it('disables inputs when disabled prop is true', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        disabled={true}
        testID="workout"
      />
    )

    expect(getByTestId('workout:muscle-name-input').props['editable']).toBe(false)
    expect(getByTestId('workout:equipment-name-input').props['editable']).toBe(false)
    expect(getByTestId('workout:equipment-weight-input').props['editable']).toBe(false)
  })

  it('applies focus from quick-pick', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.press(getByTestId('workout:focus-secondary'))
    fireEvent.changeText(getByTestId('workout:muscle-name-input'), 'arms')
    fireEvent.press(getByTestId('workout:add-muscle-button'))

    expect(mockOnChangeMuscles).toHaveBeenCalledWith([
      { name: 'arms', focus: 'secondary' },
    ])
  })

  it('applies muscle name from suggestion', () => {
    const { getByTestId } = render(
      <WorkoutEditor
        targetMuscles={[]}
        equipment={[]}
        onChangeTargetMuscles={mockOnChangeMuscles}
        onChangeEquipment={mockOnChangeEquipment}
        testID="workout"
      />
    )

    fireEvent.press(getByTestId('workout:muscle-chest'))

    expect(getByTestId('workout:muscle-name-input').props['value']).toBe('chest')
  })
})
