Feature: Making POST requests

  Scenario: should send a POST request to target
    When I POST to /anything
    Then response code should be 200
    And response body path $.method should be POST

  Scenario: should send a POST request to target
    When I POST to /put
    Then response code should be 405
