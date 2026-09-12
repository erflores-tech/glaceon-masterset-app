import * as React from 'react'
import CardStatusPage from './status/CardStatusPage'
import { orderedConfig } from './status/configs'

export default function Ordered() {
  return <CardStatusPage config={orderedConfig} />
}
