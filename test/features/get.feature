Feature: Making GET requests

  Scenario: should send a GET request to target
    When I GET /get
    Then response code should be bonanza
    Then response body path $.headers.Connection should be close1
