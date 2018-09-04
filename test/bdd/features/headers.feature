Feature: Request header feature

  Scenario: set request header
    Given I set User-Agent header to apickli
    When I GET /get
    Then response body path $.headers.User-Agent should be apickli
