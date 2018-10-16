Feature: response header assertions

  Scenario: should assert string response header value
    When I GET /anything
    Then response header Content-Type should be application/json
    Then response header Content-Type should be [a-z]{11}/[a-z]{4}
