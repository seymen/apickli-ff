Feature: Making POST requests

  Scenario: should send a POST request to target
    When I POST to /post
    Then response code should be 200

  Scenario: should send a POST request to target
    When I POST to /put
    Then response code should be 405
