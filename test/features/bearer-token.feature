Feature: Setting bearer token

  Scenario: setting bearer token
    Given I set bearer token to abcd
    When I GET /get
    Then response body path $.headers.Authorization should be Bearer abcd