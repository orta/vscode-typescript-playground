export interface ExamplesOverview {
  sections: Section[]
  sortedSubSections: string[]
  examples: Example[]
}

export interface Example {
  path: string[]
  title: string
  name: string
  lang: string
  id: string
  sortIndex: number
  hash: string
  compilerSettings?: any
}

export interface Section {
  name: string
  id: string
  subtitle: string
}

export const getExamples = async () => {
  const response = await fetch("https://www.typescriptlang.org/js/examples/en.json")
  return (await response.json()) as ExamplesOverview
}
