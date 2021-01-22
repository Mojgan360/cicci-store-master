import * as contentful from 'contentful'

export const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: 'hv29o2l9p1l2',
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: '0g-pdfp5hJ_2RJALEnXJmZNz8j-CUj5vE4yqVW44-UI',
})
