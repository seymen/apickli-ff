Feature: response header assertions

  Scenario: should assert string response header value
    When I GET /anything
    Then response header Content-Type should be application/json
    And response header Content-Type should be [a-z]{11}/[a-z]{4}
    And response header Content-Type should be (.+)
    And response header Content-Type should not be text/html
