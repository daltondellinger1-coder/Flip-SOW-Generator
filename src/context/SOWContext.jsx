import { createContext, useContext, useReducer } from 'react'
import { defaultTerms } from '../utils/defaultTerms'

const SOWContext = createContext(null)

export const initialState = {
  // Company / Client Info
  companyName: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  sowDate: new Date().toISOString().split('T')[0],

  // Project Overview
  projectName: '',
  projectDescription: '',
  objectives: [''],

  // Scope of Work
  deliverables: [{ title: '', description: '' }],

  // Timeline
  phases: [{ name: '', startDate: '', endDate: '', description: '' }],

  // Pricing
  lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
  paymentSchedule: '50% upfront, 50% upon completion',

  // Terms
  termsAndConditions: defaultTerms,
}

function sowReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value }

    case 'ADD_LIST_ITEM':
      return {
        ...state,
        [action.field]: [...state[action.field], action.template],
      }

    case 'REMOVE_LIST_ITEM': {
      const list = [...state[action.field]]
      if (list.length <= 1) return state
      list.splice(action.index, 1)
      return { ...state, [action.field]: list }
    }

    case 'UPDATE_LIST_ITEM': {
      const list = [...state[action.field]]
      list[action.index] = { ...list[action.index], ...action.value }
      return { ...state, [action.field]: list }
    }

    case 'UPDATE_SIMPLE_LIST_ITEM': {
      const list = [...state[action.field]]
      list[action.index] = action.value
      return { ...state, [action.field]: list }
    }

    case 'ADD_SIMPLE_LIST_ITEM':
      return {
        ...state,
        [action.field]: [...state[action.field], ''],
      }

    case 'REMOVE_SIMPLE_LIST_ITEM': {
      const list = [...state[action.field]]
      if (list.length <= 1) return state
      list.splice(action.index, 1)
      return { ...state, [action.field]: list }
    }

    case 'LOAD_DRAFT':
      return { ...initialState, ...action.data }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

export function SOWProvider({ children }) {
  const [state, dispatch] = useReducer(sowReducer, initialState)

  return (
    <SOWContext.Provider value={{ state, dispatch }}>
      {children}
    </SOWContext.Provider>
  )
}

export function useSOW() {
  const context = useContext(SOWContext)
  if (!context) throw new Error('useSOW must be used within SOWProvider')
  return context
}
