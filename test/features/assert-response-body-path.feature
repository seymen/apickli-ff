Feature: Response body path matches

  Scenario: should assert json response body path matches
    When I GET /anything
    Then response body path $.headers.Host should be httpbin.org
    And response body path $.origin should be \d+\.\d+.\d+.\d+
    And response body path $.headers.Host should not be bob
    And response body path $.data should not be .+

  Scenario: should assert json arrays
    Given I pipe contents of file array.json to body
    When I POST to /post
    Then response body path $.json[0].a should be b
    And response body path $.json.length should be 2
  
  Scenario: should assert json response body path type
    Given I pipe contents of file array.json to body
    When I POST to /post
    Then response body path $.json should be of type array
  
  Scenario: should assert json response body path type and length
    Given I pipe contents of file array.json to body
    When I POST to /post
    Then response body path $.json should be of type array with length 2

