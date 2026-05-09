import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import Mermaid from './Mermaid'

type PreProps = ComponentPropsWithoutRef<'pre'> & {
  children?: ReactNode
}

type CodeNodeProps = {
  className?: string
  children?: ReactNode
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((item) => extractTextContent(item)).join('')
  }

  if (node && typeof node === 'object' && 'props' in node) {
    const childNode = (node as ReactElement<{ children?: ReactNode }>).props?.children
    return extractTextContent(childNode)
  }

  return ''
}

function MdxPre(props: PreProps) {
  const child = props.children
  const codeChild = (Array.isArray(child) ? child[0] : child) as
    | ReactElement<CodeNodeProps>
    | undefined

  if (
    codeChild &&
    typeof codeChild === 'object' &&
    codeChild.props?.className?.includes('language-mermaid')
  ) {
    const rawText = extractTextContent(codeChild.props?.children).trim()
    const chart = rawText
      .replace(/^```(?:mermaid)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    return chart ? <Mermaid chart={chart} /> : <Pre {...props}>{props.children ?? ''}</Pre>
  }

  return <Pre {...props}>{props.children ?? ''}</Pre>
}

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: MdxPre,
  table: TableWrapper,
  BlogNewsletterForm,
}
