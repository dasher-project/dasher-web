
describe('Dasher', () => {
  before(() => {
    cy.visit('/browser/index.html')
  })

  it('should render the core UI controls', () => {
    cy.contains('button', 'New', {timeout: 10000}).should('be.visible')
    cy.contains('button', 'Prefs').should('be.visible')
    cy.get('#user-interface').should('exist')
  })

  it('A screenshot will be saved.', () => {
    cy.screenshot({overwrite:true})
  })
})
