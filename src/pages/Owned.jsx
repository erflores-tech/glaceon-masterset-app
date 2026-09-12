import * as React from 'react'
import CardStatusPage from './status/CardStatusPage'
import { ownedConfig } from './status/configs'

export default function Owned() {
  return <CardStatusPage config={ownedConfig} />
}
