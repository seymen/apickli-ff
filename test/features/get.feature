Feature: Making GET requests

  Scenario: should send a GET request to target
    When I GET /get
    Then response code should be 200
    And response body path $.method should be GET
