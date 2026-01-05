import React from 'react'
import { Text } from 'react-native'

interface MarkdownProps {
  children: string
  style?: object
}

const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  return <Text>{children}</Text>
}

export default Markdown

