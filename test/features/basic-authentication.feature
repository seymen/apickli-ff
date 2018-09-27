Feature: Basic authentication feature

  Scenario: set Authorization header correctly
    Given I have basic authentication credentials foo and bar
    When I GET /get
    Then response body path $.headers.Authorization should be Basic Zm9vOmJhcg==