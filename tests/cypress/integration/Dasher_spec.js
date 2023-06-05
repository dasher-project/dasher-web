
describe('Dasher', () => {
  before(() => {
    cy.visit('http://127.0.0.1:8000')
  })

  it('should display "dasher" text on page', () => {
    cy.contains('dasher')
  })

  it('A screenshot will be saved.', () => {
    cy.screenshot({overwrite:true})
  })
})
