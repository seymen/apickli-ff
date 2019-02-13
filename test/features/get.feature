Feature: Making GET requests

  Scenario: should send a GET request to target
    Given I set User-Agent header to `userAgent`
    When I GET /get
    Then response code should be `successCode`
    Then response body path $.headers.Connection should be close
    Then response body path $.headers.User-Agent should be apickli
