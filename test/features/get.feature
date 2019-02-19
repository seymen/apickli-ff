Feature: Making GET requests

  Scenario: should send a GET request to target
    Given I set User-Agent header to `userAgent`
    When I GET /get
    Then response code should be `successCode`
    And response code should be 200
    And response body path $.headers.User-Agent should be apickli
