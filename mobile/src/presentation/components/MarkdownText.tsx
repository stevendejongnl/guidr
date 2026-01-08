import React from 'react'
import { StyleSheet } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { colors, typography } from '../theme'

interface MarkdownTextProps {
  children: string
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ children }) => {
  return (
    <Markdown style={markdownStyles}>
      {children}
    </Markdown>
  )
}

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.textSecondary,
    fontSize: typography.sizeSm,
    lineHeight: 20,
  },
  heading1: {
    color: colors.textPrimary,
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    color: colors.textPrimary,
    fontSize: typography.sizeMd,
    fontWeight: typography.weightSemibold,
    marginTop: 8,
    marginBottom: 4,
  },
  heading3: {
    color: colors.textPrimary,
    fontSize: typography.sizeSm,
    fontWeight: typography.weightSemibold,
    marginTop: 6,
    marginBottom: 2,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  bullet_list: {
    marginTop: 0,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 0,
    marginBottom: 8,
  },
  list_item: {
    marginTop: 2,
    marginBottom: 2,
  },
  bullet_list_icon: {
    color: colors.textSecondary,
    fontSize: typography.sizeSm,
    lineHeight: 20,
    marginRight: 8,
  },
  ordered_list_icon: {
    color: colors.textSecondary,
    fontSize: typography.sizeSm,
    lineHeight: 20,
    marginRight: 8,
  },
  code_inline: {
    backgroundColor: colors.surfaceLight,
    color: colors.primary,
    fontSize: typography.sizeXs,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: colors.surfaceLight,
    color: colors.textSecondary,
    fontSize: typography.sizeXs,
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: colors.surfaceLight,
    color: colors.textSecondary,
    fontSize: typography.sizeXs,
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: colors.surfaceLight,
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 8,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  strong: {
    fontWeight: typography.weightBold,
    color: colors.textPrimary,
  },
  em: {
    fontStyle: 'italic',
  },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 12,
  },
})

